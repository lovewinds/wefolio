import { prisma } from '@/lib/prisma';
import type { Category, Prisma } from '@prisma/client';

type CategoryWithRelations = Category & {
  parent?: Category | null;
  children?: Category[];
};

export const categoryRepository = {
  async findAll(): Promise<Category[]> {
    return prisma.category.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  // 계층 구조 포함하여 조회
  async findAllWithHierarchy(): Promise<CategoryWithRelations[]> {
    return prisma.category.findMany({
      include: {
        parent: true,
        children: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  // 대분류만 조회 (자식 포함)
  async findParentCategories(): Promise<CategoryWithRelations[]> {
    return prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  // 특정 대분류의 소분류 조회
  async findChildrenByParentId(parentId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { parentId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    });
  },

  async findByIdWithRelations(id: string): Promise<CategoryWithRelations | null> {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });
  },

  async findByType(type: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { type },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  // 특정 타입의 대분류만 조회 (자식 포함)
  async findParentsByType(type: string): Promise<CategoryWithRelations[]> {
    return prisma.category.findMany({
      where: { type, parentId: null },
      include: {
        children: true,
      },
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
