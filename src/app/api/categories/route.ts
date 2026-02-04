import { NextResponse } from 'next/server';
import { z } from 'zod';
import { categoryRepository } from '@/repositories/category-repository';

const categoriesQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  grouped: z
    .string()
    .optional()
    .transform(v => v === 'true'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = categoriesQuerySchema.safeParse({
      type: searchParams.get('type') ?? undefined,
      grouped: searchParams.get('grouped') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const { type, grouped } = parsed.data;

    if (grouped && type) {
      const parentCategories = await categoryRepository.findParentsByType(type);

      const groupedData = parentCategories.map(parent => ({
        id: parent.id,
        name: parent.name,
        icon: parent.icon,
        color: parent.color,
        children: parent.children?.map(child => ({
          id: child.id,
          name: child.name,
          icon: child.icon,
          color: child.color,
          parentId: parent.id,
          parentName: parent.name,
        })),
      }));

      return NextResponse.json({ success: true, data: groupedData });
    }

    const allCategories = await categoryRepository.findAllWithHierarchy();

    const filteredCategories = type
      ? allCategories.filter(cat => cat.type === type)
      : allCategories;

    const childCategories = filteredCategories
      .filter(cat => cat.parentId !== null)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: cat.isDefault,
        parentId: cat.parentId,
        parentName: cat.parent?.name,
        parentIcon: cat.parent?.icon,
      }));

    return NextResponse.json({ success: true, data: childCategories });
  } catch (error) {
    console.error('Categories API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
