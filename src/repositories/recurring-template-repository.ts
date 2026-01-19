import { prisma } from '@/lib/prisma';
import type { RecurringTemplate, Prisma } from '@prisma/client';

export const recurringTemplateRepository = {
  async findAll(): Promise<RecurringTemplate[]> {
    return prisma.recurringTemplate.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string): Promise<RecurringTemplate | null> {
    return prisma.recurringTemplate.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async create(data: Prisma.RecurringTemplateCreateInput): Promise<RecurringTemplate> {
    return prisma.recurringTemplate.create({
      data,
      include: { category: true },
    });
  },

  async update(id: string, data: Prisma.RecurringTemplateUpdateInput): Promise<RecurringTemplate> {
    return prisma.recurringTemplate.update({
      where: { id },
      data,
      include: { category: true },
    });
  },

  async delete(id: string): Promise<RecurringTemplate> {
    return prisma.recurringTemplate.delete({
      where: { id },
    });
  },
};
