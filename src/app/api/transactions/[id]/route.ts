import { NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction-service';
import { parseLocalDate } from '@/lib/date-utils';
import { createTransactionSchema } from '@/lib/validations/transaction';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    const body = await request.json();
    const result = createTransactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { type, amount, categoryId, date, paymentMethod, user, description } = result.data;

    const transaction = await transactionService.update(id, {
      type,
      amount,
      description: description || null,
      date: parseLocalDate(date),
      category: { connect: { id: categoryId } },
      paymentMethod: paymentMethod || null,
      user: user || null,
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Transaction Update Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

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
