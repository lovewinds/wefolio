import { prisma } from '@/lib/prisma';
import type { Category, Prisma } from '@prisma/client';

export const categoryRepository = {
  async findAll(): Promise<Category[]> {
    return prisma.category.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    });
  },

  async findByType(type: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { type },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  },

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<Category> {
    return prisma.category.delete({
      where: { id },
    });
  },
};
