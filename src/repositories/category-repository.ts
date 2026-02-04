import { prisma } from '@/lib/prisma';
import type { BudgetCategory, Prisma } from '@prisma/client';

type CategoryWithRelations = BudgetCategory & {
  parent?: BudgetCategory | null;
  children?: BudgetCategory[];
};

export const categoryRepository = {
  async findAll(): Promise<BudgetCategory[]> {
    return prisma.budgetCategory.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  // 계층 구조 포함하여 조회
  async findAllWithHierarchy(): Promise<CategoryWithRelations[]> {
    return prisma.budgetCategory.findMany({
      include: {
        parent: true,
        children: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  // 대분류만 조회 (자식 포함)
  async findParentCategories(): Promise<CategoryWithRelations[]> {
    return prisma.budgetCategory.findMany({
      where: { parentId: null },
      include: {
        children: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  // 특정 대분류의 소분류 조회
  async findChildrenByParentId(parentId: string): Promise<BudgetCategory[]> {
    return prisma.budgetCategory.findMany({
      where: { parentId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async findById(id: string): Promise<BudgetCategory | null> {
    return prisma.budgetCategory.findUnique({
      where: { id },
    });
  },

  async findByIdWithRelations(id: string): Promise<CategoryWithRelations | null> {
    return prisma.budgetCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });
  },

  async findByType(type: string): Promise<BudgetCategory[]> {
    return prisma.budgetCategory.findMany({
      where: { type },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  // 특정 타입의 대분류만 조회 (자식 포함)
  async findParentsByType(type: string): Promise<CategoryWithRelations[]> {
    return prisma.budgetCategory.findMany({
      where: { type, parentId: null },
      include: {
        children: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async create(data: Prisma.BudgetCategoryCreateInput): Promise<BudgetCategory> {
    return prisma.budgetCategory.create({ data });
  },

  async update(id: string, data: Prisma.BudgetCategoryUpdateInput): Promise<BudgetCategory> {
    return prisma.budgetCategory.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<BudgetCategory> {
    return prisma.budgetCategory.delete({
      where: { id },
    });
  },
};
