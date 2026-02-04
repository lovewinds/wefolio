import { NextResponse } from 'next/server';
import { yearMonthSchema } from '@/lib/validations/common';
import { dashboardService } from '@/services/dashboard-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const parsed = yearMonthSchema.safeParse({
      year: searchParams.get('year') ?? now.getFullYear(),
      month: searchParams.get('month') ?? now.getMonth() + 1,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid year or month' }, { status: 400 });
    }

    const { year, month } = parsed.data;
    const data = await dashboardService.getMonthlyData(year, month);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
