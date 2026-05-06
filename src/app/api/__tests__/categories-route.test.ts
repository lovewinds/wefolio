import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/categories/route';
import { categoryRepository } from '@/repositories/category-repository';

vi.mock('@/repositories/category-repository', () => ({
  categoryRepository: {
    findAllWithHierarchy: vi.fn(),
    findParentsByType: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/categories', () => {
  it('returns 400 for invalid type query', async () => {
    const response = await GET(new Request('http://localhost/api/categories?type=transfer'));
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'Invalid query parameters' });
    expect(categoryRepository.findAllWithHierarchy).not.toHaveBeenCalled();
  });

  it('returns flat child category response shape', async () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    const parent = category({
      id: 'parent-1',
      name: 'Food',
      icon: 'F',
      color: '#111111',
      parentId: null,
      createdAt: now,
      updatedAt: now,
    });
    const child = {
      ...category({
        id: 'child-1',
        name: 'Groceries',
        icon: 'G',
        color: '#222222',
        parentId: 'parent-1',
        createdAt: now,
        updatedAt: now,
      }),
      parent,
      children: [],
    };

    vi.mocked(categoryRepository.findAllWithHierarchy).mockResolvedValue([
      { ...parent, parent: null, children: [child] },
      child,
    ]);

    const response = await GET(new Request('http://localhost/api/categories?type=expense'));
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [
        {
          id: 'child-1',
          name: 'Groceries',
          type: 'expense',
          icon: 'G',
          color: '#222222',
          isDefault: false,
          parentId: 'parent-1',
          parentName: 'Food',
          parentIcon: 'F',
        },
      ],
    });
  });

  it('returns grouped parent and children response shape', async () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    const parent = category({
      id: 'parent-1',
      name: 'Food',
      icon: 'F',
      color: '#111111',
      parentId: null,
      createdAt: now,
      updatedAt: now,
    });
    const child = category({
      id: 'child-1',
      name: 'Groceries',
      icon: 'G',
      color: '#222222',
      parentId: 'parent-1',
      createdAt: now,
      updatedAt: now,
    });

    vi.mocked(categoryRepository.findParentsByType).mockResolvedValue([
      { ...parent, parent: null, children: [child] },
    ]);

    const response = await GET(
      new Request('http://localhost/api/categories?grouped=true&type=expense')
    );
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [
        {
          id: 'parent-1',
          name: 'Food',
          icon: 'F',
          color: '#111111',
          children: [
            {
              id: 'child-1',
              name: 'Groceries',
              icon: 'G',
              color: '#222222',
              parentId: 'parent-1',
              parentName: 'Food',
            },
          ],
        },
      ],
    });
  });

  it('returns 500 when repository throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(categoryRepository.findAllWithHierarchy).mockRejectedValue(
      new Error('database failed')
    );

    const response = await GET(new Request('http://localhost/api/categories'));
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Failed to fetch categories' });

    consoleError.mockRestore();
  });
});

type ApiBody = {
  success: boolean;
  data?: unknown;
  error?: string;
};

function category(overrides: {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: overrides.id,
    name: overrides.name,
    type: 'expense',
    icon: overrides.icon,
    color: overrides.color,
    isDefault: false,
    parentId: overrides.parentId,
    createdAt: overrides.createdAt,
    updatedAt: overrides.updatedAt,
  };
}
