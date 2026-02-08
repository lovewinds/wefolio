import { NextResponse } from 'next/server';
import { holdingService } from '@/services/holding-service';

export async function GET() {
  try {
    const data = await holdingService.getAllWithAccountInfo();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Asset Holdings GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch holdings' },
      { status: 500 }
    );
  }
}
