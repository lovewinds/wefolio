import { prisma } from '@/lib/prisma';
import type { Transaction, Prisma } from '@prisma/client';

export const transactionRepository = {
  async findAll(): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  },

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return prisma.transaction.findMany({
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

  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return prisma.transaction.create({
      data,
      include: { category: true },
    });
  },

  async update(id: string, data: Prisma.TransactionUpdateInput): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data,
      include: { category: true },
    });
  },

  async delete(id: string): Promise<Transaction> {
    return prisma.transaction.delete({
      where: { id },
    });
  },
};
