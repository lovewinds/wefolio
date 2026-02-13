import { transactionRepository } from '@/repositories/transaction-repository';
import { recurringTemplateRepository } from '@/repositories/recurring-template-repository';
import { getMonthRangeUTC } from '@/lib/date-utils';
import type { BudgetTransaction, Prisma } from '@prisma/client';
import type { TransactionInputOptions } from '@/types';

type TransactionKind = 'income' | 'expense';

function normalizeAndSort(values: string[]): string[] {
  const deduped = new Set<string>();
  values.forEach(value => {
    const trimmed = value.trim();
    if (trimmed) deduped.add(trimmed);
  });
  return Array.from(deduped).sort((a, b) => a.localeCompare(b, 'ko'));
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
