import { prisma } from '@/lib/prisma';
import type { BudgetRecurringTemplate, Prisma } from '@prisma/client';

export const recurringTemplateRepository = {
  async findAll(): Promise<BudgetRecurringTemplate[]> {
    return prisma.budgetRecurringTemplate.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string): Promise<BudgetRecurringTemplate | null> {
    return prisma.budgetRecurringTemplate.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async create(data: Prisma.BudgetRecurringTemplateCreateInput): Promise<BudgetRecurringTemplate> {
    return prisma.budgetRecurringTemplate.create({
      data,
      include: { category: true },
    });
  },

  async update(
    id: string,
    data: Prisma.BudgetRecurringTemplateUpdateInput
  ): Promise<BudgetRecurringTemplate> {
    return prisma.budgetRecurringTemplate.update({
      where: { id },
      data,
      include: { category: true },
    });
  },

  async delete(id: string): Promise<BudgetRecurringTemplate> {
    return prisma.budgetRecurringTemplate.delete({
      where: { id },
    });
  },
};
