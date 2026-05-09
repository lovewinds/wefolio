import { transactionRepository } from '@/repositories/transaction-repository';
import { recurringTemplateRepository } from '@/repositories/recurring-template-repository';
import { formatDateString, getMonthRangeUTC } from '@/lib/date-utils';
import type { BudgetTransaction, Prisma } from '@prisma/client';
import type {
  DashboardMonthRange,
  DashboardTransaction,
  TransactionInputOptions,
  TransactionListData,
} from '@/types';

type TransactionKind = 'income' | 'expense';
type TransactionListParams = { year: number; month: number } | { startDate: Date; endDate: Date };

type BudgetTransactionWithCategory = BudgetTransaction & {
  category?: {
    name: string;
  } | null;
};

function normalizeAndSort(values: string[]): string[] {
  const deduped = new Set<string>();
  values.forEach(value => {
    const trimmed = value.trim();
    if (trimmed) deduped.add(trimmed);
  });
  return Array.from(deduped).sort((a, b) => a.localeCompare(b, 'ko'));
}

function toDashboardTransaction(tx: BudgetTransactionWithCategory): DashboardTransaction {
  return {
    id: tx.id,
    type: tx.type as TransactionKind,
    amount: tx.amount,
    category: tx.category?.name ?? 'Unknown',
    description: tx.description ?? undefined,
    date: formatDateString(tx.date),
    paymentMethod: tx.paymentMethod ?? undefined,
    user: tx.user ?? undefined,
  };
}

function toDashboardMonthRange(
  min: Date | null,
  max: Date | null
): DashboardMonthRange | undefined {
  if (!min || !max) return undefined;

  return {
    min: {
      year: min.getFullYear(),
      month: min.getMonth() + 1,
    },
    max: {
      year: max.getFullYear(),
      month: max.getMonth() + 1,
    },
  };
}

export const transactionService = {
  async getAll(): Promise<BudgetTransaction[]> {
    return transactionRepository.findAll();
  },

  async getById(id: string): Promise<BudgetTransaction | null> {
    return transactionRepository.findById(id);
  },

  async getByMonth(year: number, month: number): Promise<BudgetTransaction[]> {
    const { start, end } = getMonthRangeUTC(year, month);
    return transactionRepository.findByDateRange(start, end);
  },

  async list(params: TransactionListParams): Promise<TransactionListData> {
    const { start, end } =
      'year' in params
        ? getMonthRangeUTC(params.year, params.month)
        : { start: params.startDate, end: params.endDate };

    const [transactions, dateRange] = await Promise.all([
      transactionRepository.findByDateRange(start, end),
      transactionRepository.getDateRange(),
    ]);

    return {
      transactions: (transactions as BudgetTransactionWithCategory[]).map(toDashboardTransaction),
      availableRange: toDashboardMonthRange(dateRange.min, dateRange.max),
    };
  },

  async getDateRange(): Promise<{ min: Date | null; max: Date | null }> {
    return transactionRepository.getDateRange();
  },

  async getInputOptions(type?: TransactionKind): Promise<TransactionInputOptions> {
    const [users, paymentMethods, pairs] = await Promise.all([
      transactionRepository.findDistinctUsers(type),
      transactionRepository.findDistinctPaymentMethods(type),
      transactionRepository.findUserPaymentMethodPairs(type),
    ]);

    const normalizedUsers = normalizeAndSort(users);
    const normalizedPaymentMethods = normalizeAndSort(paymentMethods);

    const grouped = new Map<string, Set<string>>();
    pairs.forEach(pair => {
      const user = pair.user.trim();
      const paymentMethod = pair.paymentMethod.trim();
      if (!user || !paymentMethod) return;

      const methods = grouped.get(user) ?? new Set<string>();
      methods.add(paymentMethod);
      grouped.set(user, methods);
    });

    const paymentMethodsByUser: Record<string, string[]> = {};
    grouped.forEach((methods, user) => {
      paymentMethodsByUser[user] = Array.from(methods).sort((a, b) => a.localeCompare(b, 'ko'));
    });

    return {
      users: normalizedUsers,
      paymentMethods: normalizedPaymentMethods,
      paymentMethodsByUser,
    };
  },

  async create(data: Prisma.BudgetTransactionCreateInput): Promise<BudgetTransaction> {
    return transactionRepository.create(data);
  },

  async createFromTemplate(templateId: string, date: Date): Promise<BudgetTransaction> {
    const template = await recurringTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return transactionRepository.create({
      type: template.type,
      amount: template.amount,
      description: template.description,
      date,
      category: { connect: { id: template.categoryId } },
    });
  },

  async update(id: string, data: Prisma.BudgetTransactionUpdateInput): Promise<BudgetTransaction> {
    return transactionRepository.update(id, data);
  },

  async delete(id: string): Promise<BudgetTransaction> {
    return transactionRepository.delete(id);
  },
};
