import { NextRequest, NextResponse } from 'next/server';
import { dataManagementService } from '@/services/data-management-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: '업로드할 .xlsx 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await dataManagementService.loadFromUpload(buffer);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Data Load Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load data';
    return NextResponse.json(
      { success: false, error: `데이터 로드 실패: ${message}` },
      { status: 500 }
    );
  }
}
