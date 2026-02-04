import { prisma } from '@/lib/prisma';
import type { BudgetTransaction, Prisma } from '@prisma/client';

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
