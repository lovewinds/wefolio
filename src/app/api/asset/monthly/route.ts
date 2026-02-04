import { NextRequest, NextResponse } from 'next/server';
import { yearMonthSchema } from '@/lib/validations/common';
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
    const data = await holdingValueSnapshotService.getMonthlyAssetData(year, month);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Asset Monthly API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset data' },
      { status: 500 }
    );
  }
}
