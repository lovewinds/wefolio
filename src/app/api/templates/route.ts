import { NextRequest, NextResponse } from 'next/server';
import { recurringTemplateRepository } from '@/repositories/recurring-template-repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');

    const templates = await recurringTemplateRepository.findAll();

    const filtered = type ? templates.filter(t => t.type === type) : templates;

    return NextResponse.json({
      success: true,
      data: filtered.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        amount: t.amount,
        description: t.description,
        categoryId: t.categoryId,
        category: (t as Record<string, unknown>).category,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
