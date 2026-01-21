import { NextResponse } from 'next/server';
import { categoryService } from '@/services/category-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'income' | 'expense' | null;

    const categories = type
      ? await categoryService.getByType(type)
      : await categoryService.getAll();

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Categories API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
