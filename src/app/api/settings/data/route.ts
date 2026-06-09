import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dataManagementService } from '@/services/data-management-service';

export const dynamic = 'force-dynamic';

const domainSchema = z.enum(['budget', 'asset']);

export async function GET() {
  try {
    const counts = await dataManagementService.getCounts();
    return NextResponse.json({ success: true, data: counts });
  } catch (error) {
    console.error('Data Counts Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load data counts' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = domainSchema.safeParse(searchParams.get('domain'));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain (budget|asset)' },
        { status: 400 }
      );
    }

    const counts = await dataManagementService.deleteDomain(parsed.data);
    return NextResponse.json({ success: true, data: counts });
  } catch (error) {
    console.error('Data Delete Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete data' }, { status: 500 });
  }
}
