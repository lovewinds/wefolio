import { beforeEach, describe, expect, it, vi } from 'vitest';
import { categoryRepository } from '@/repositories/category-repository';
import { categoryService } from '@/services/category-service';

vi.mock('@/repositories/category-repository', () => ({
  categoryRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('categoryService', () => {
  it('forces custom categories to be non-default on create', async () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    const createdCategory = {
      id: 'category-1',
      name: 'Custom',
      type: 'expense',
      icon: null,
      color: null,
      isDefault: false,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    };

    vi.mocked(categoryRepository.create).mockResolvedValue(createdCategory);

    await categoryService.create({
      name: 'Custom',
      type: 'expense',
      isDefault: true,
    });

    expect(categoryRepository.create).toHaveBeenCalledWith({
      name: 'Custom',
      type: 'expense',
      isDefault: false,
    });
  });

  it('rejects deletion of default categories', async () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    vi.mocked(categoryRepository.findById).mockResolvedValue({
      id: 'category-1',
      name: 'Default',
      type: 'expense',
      icon: null,
      color: null,
      isDefault: true,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    });

    await expect(categoryService.delete('category-1')).rejects.toThrow(
      'Cannot delete default category'
    );
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });

  it('does not seed defaults when categories already exist', async () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    vi.mocked(categoryRepository.findAll).mockResolvedValue([
      {
        id: 'category-1',
        name: 'Existing',
        type: 'expense',
        icon: null,
        color: null,
        isDefault: false,
        parentId: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await categoryService.seedDefaultCategories();

    expect(categoryRepository.create).not.toHaveBeenCalled();
  });
});
