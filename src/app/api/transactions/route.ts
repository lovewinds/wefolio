import { NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction-service';
import { parseLocalDate } from '@/lib/date-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, amount, categoryId, date, paymentMethod, user, description } = body;

    if (!type || !amount || !categoryId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const transaction = await transactionService.create({
      type,
      amount: parseFloat(amount),
      description: description || null,
      date: parseLocalDate(date),
      category: { connect: { id: categoryId } },
      paymentMethod: paymentMethod || null,
      user: user || null,
    });

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    console.error('Transaction Create Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
