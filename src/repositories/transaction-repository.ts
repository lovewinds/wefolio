import { prisma } from '@/lib/prisma';
import type { BudgetTransaction, Prisma } from '@prisma/client';

type TransactionKind = 'income' | 'expense';

export const transactionRepository = {
  async findAll(): Promise<BudgetTransaction[]> {
    return prisma.budgetTransaction.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  },

  async findById(id: string): Promise<BudgetTransaction | null> {
    return prisma.budgetTransaction.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async findByDateRange(startDate: Date, endDate: Date): Promise<BudgetTransaction[]> {
    return prisma.budgetTransaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  },

  async findDistinctUsers(type?: TransactionKind): Promise<string[]> {
    const rows = await prisma.budgetTransaction.findMany({
      where: {
        ...(type ? { type } : {}),
        user: { not: null },
      },
      select: { user: true },
      distinct: ['user'],
    });

    return rows
      .map(row => row.user)
      .filter((user): user is string => typeof user === 'string' && user.trim().length > 0);
  },

  async findDistinctPaymentMethods(type?: TransactionKind): Promise<string[]> {
    const rows = await prisma.budgetTransaction.findMany({
      where: {
        ...(type ? { type } : {}),
        paymentMethod: { not: null },
      },
      select: { paymentMethod: true },
      distinct: ['paymentMethod'],
    });

    return rows
      .map(row => row.paymentMethod)
      .filter(
        (paymentMethod): paymentMethod is string =>
          typeof paymentMethod === 'string' && paymentMethod.trim().length > 0
      );
  },

  async findUserPaymentMethodPairs(
    type?: TransactionKind
  ): Promise<Array<{ user: string; paymentMethod: string }>> {
    const rows = await prisma.budgetTransaction.findMany({
      where: {
        ...(type ? { type } : {}),
        user: { not: null },
        paymentMethod: { not: null },
      },
      select: {
        user: true,
        paymentMethod: true,
      },
      distinct: ['user', 'paymentMethod'],
    });

    return rows.filter(
      (row): row is { user: string; paymentMethod: string } =>
        typeof row.user === 'string' &&
        row.user.trim().length > 0 &&
        typeof row.paymentMethod === 'string' &&
        row.paymentMethod.trim().length > 0
    );
  },

  async getDateRange(): Promise<{ min: Date | null; max: Date | null }> {
    const result = await prisma.budgetTransaction.aggregate({
      _min: { date: true },
      _max: { date: true },
    });

    return {
      min: result._min.date ?? null,
      max: result._max.date ?? null,
    };
  },

  async create(data: Prisma.BudgetTransactionCreateInput): Promise<BudgetTransaction> {
    return prisma.budgetTransaction.create({
      data,
      include: { category: true },
    });
  },

  async update(id: string, data: Prisma.BudgetTransactionUpdateInput): Promise<BudgetTransaction> {
    return prisma.budgetTransaction.update({
      where: { id },
      data,
      include: { category: true },
    });
  },

  async delete(id: string): Promise<BudgetTransaction> {
    return prisma.budgetTransaction.delete({
      where: { id },
    });
  },
};
