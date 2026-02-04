import { NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction-service';
import { parseLocalDate } from '@/lib/date-utils';
import { createTransactionSchema } from '@/lib/validations/transaction';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createTransactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { type, amount, categoryId, date, paymentMethod, user, description } = result.data;

    const transaction = await transactionService.create({
      type,
      amount,
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
