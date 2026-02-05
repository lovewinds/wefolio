import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { holdingValueSnapshotService } from '@/services/holding-service';

const trendSchema = z.object({
  startYear: z.coerce.number().int().min(2000).max(2100),
  startMonth: z.coerce.number().int().min(1).max(12),
  endYear: z.coerce.number().int().min(2000).max(2100),
  endMonth: z.coerce.number().int().min(1).max(12),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = trendSchema.safeParse({
      startYear: searchParams.get('startYear'),
      startMonth: searchParams.get('startMonth'),
      endYear: searchParams.get('endYear'),
      endMonth: searchParams.get('endMonth'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing parameters' },
        { status: 400 }
      );
    }

    const { startYear, startMonth, endYear, endMonth } = parsed.data;
    const data = await holdingValueSnapshotService.getAssetTrendData(
      startYear,
      startMonth,
      endYear,
      endMonth
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Asset Trend API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset trend data' },
      { status: 500 }
    );
  }
}
