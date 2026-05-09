import { NextRequest, NextResponse } from 'next/server';
import { yearMonthSchema } from '@/lib/validations/common';
import { saveMonthlyInputSchema } from '@/lib/validations/asset-monthly-input';
import { holdingValueSnapshotService } from '@/services/holding-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = yearMonthSchema.safeParse({
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing year/month parameters' },
        { status: 400 }
      );
    }

    const { year, month } = parsed.data;
    const data = await holdingValueSnapshotService.getMonthlyInputDraft(year, month);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Asset Monthly Input GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset monthly input draft' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = saveMonthlyInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { year, month, rows } = parsed.data;
    const data = await holdingValueSnapshotService.saveMonthlyInput(year, month, rows);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Asset Monthly Input POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save asset monthly input' },
      { status: 500 }
    );
  }
}
