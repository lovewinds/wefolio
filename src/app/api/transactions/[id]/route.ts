import { NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction-service';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    await transactionService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction Delete Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
