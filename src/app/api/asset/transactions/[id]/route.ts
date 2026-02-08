import { NextResponse } from 'next/server';
import { holdingTransactionService } from '@/services/holding-service';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    await holdingTransactionService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Asset Transaction Delete Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete asset transaction' },
      { status: 500 }
    );
  }
}
