import { NextResponse } from 'next/server';
import { categoryRepository } from '@/repositories/category-repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'income' | 'expense' | null;
    const grouped = searchParams.get('grouped') === 'true';

    if (grouped && type) {
      // 대분류별로 그룹화된 소분류 반환
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

    // 기본: 소분류만 반환 (parent 정보 포함)
    const allCategories = await categoryRepository.findAllWithHierarchy();

    const filteredCategories = type
      ? allCategories.filter(cat => cat.type === type)
      : allCategories;

    // 소분류만 필터링 (parentId가 있는 것)
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
