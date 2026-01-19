import { categoryRepository } from '@/repositories/category-repository';
import type { Category, Prisma } from '@prisma/client';

// 기본 카테고리 정의
const DEFAULT_CATEGORIES = [
  // 수입 카테고리
  { name: '급여', type: 'income', icon: '💰', color: '#22c55e', isDefault: true },
  { name: '부수입', type: 'income', icon: '💵', color: '#16a34a', isDefault: true },
  { name: '투자수익', type: 'income', icon: '📈', color: '#15803d', isDefault: true },
  // 지출 카테고리
  { name: '식비', type: 'expense', icon: '🍽️', color: '#ef4444', isDefault: true },
  { name: '교통비', type: 'expense', icon: '🚗', color: '#f97316', isDefault: true },
  { name: '주거비', type: 'expense', icon: '🏠', color: '#eab308', isDefault: true },
  { name: '통신비', type: 'expense', icon: '📱', color: '#84cc16', isDefault: true },
  { name: '의료비', type: 'expense', icon: '🏥', color: '#06b6d4', isDefault: true },
  { name: '문화생활', type: 'expense', icon: '🎬', color: '#8b5cf6', isDefault: true },
  { name: '쇼핑', type: 'expense', icon: '🛒', color: '#ec4899', isDefault: true },
  { name: '기타', type: 'expense', icon: '📦', color: '#6b7280', isDefault: true },
];

export const categoryService = {
  async getAll(): Promise<Category[]> {
    return categoryRepository.findAll();
  },

  async getByType(type: 'income' | 'expense'): Promise<Category[]> {
    return categoryRepository.findByType(type);
  },

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return categoryRepository.create({
      ...data,
      isDefault: false,
    });
  },

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return categoryRepository.update(id, data);
  },

  async delete(id: string): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (category?.isDefault) {
      throw new Error('Cannot delete default category');
    }
    return categoryRepository.delete(id);
  },

  async seedDefaultCategories(): Promise<void> {
    const existing = await categoryRepository.findAll();
    if (existing.length > 0) return;

    for (const category of DEFAULT_CATEGORIES) {
      await categoryRepository.create(category);
    }
  },
};
