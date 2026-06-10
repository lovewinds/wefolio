import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dataManagementService } from '@/services/data-management-service';

export const dynamic = 'force-dynamic';

const domainSchema = z.enum(['budget', 'asset']);
const yearSchema = z.coerce.number().int().min(2000).max(2100);
const monthSchema = z.coerce.number().int().min(1).max(12);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = domainSchema.safeParse(searchParams.get('domain'));
    if (!domain.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain (budget|asset)' },
        { status: 400 }
      );
    }

    const yearRaw = searchParams.get('year');
    const monthRaw = searchParams.get('month');

    // year·month 없으면 월 목록, 있으면 해당 월 행.
    if (yearRaw === null || monthRaw === null) {
      const months = await dataManagementService.getRecordMonths(domain.data);
      return NextResponse.json({ success: true, data: months });
    }

    const year = yearSchema.safeParse(yearRaw);
    const month = monthSchema.safeParse(monthRaw);
    if (!year.success || !month.success) {
      return NextResponse.json({ success: false, error: 'Invalid year or month' }, { status: 400 });
    }

    const records = await dataManagementService.getRecords(domain.data, year.data, month.data);
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Data Records Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load records' }, { status: 500 });
  }
}
