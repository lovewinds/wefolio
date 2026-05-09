import { NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction-service';
import { parseLocalDate } from '@/lib/date-utils';
import {
  createTransactionSchema,
  listTransactionsByMonthQuerySchema,
  listTransactionsByRangeQuerySchema,
} from '@/lib/validations/transaction';

function parseLocalDateEndOfDay(dateStr: string): Date {
  const date = parseLocalDate(dateStr);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const hasMonthQuery = searchParams.has('year') || searchParams.has('month');
    const hasRangeQuery = searchParams.has('startDate') || searchParams.has('endDate');

    if (hasMonthQuery && hasRangeQuery) {
      return NextResponse.json(
        { success: false, error: 'Use either year/month or startDate/endDate' },
        { status: 400 }
      );
    }

    if (hasMonthQuery) {
      const result = listTransactionsByMonthQuerySchema.safeParse({
        year: searchParams.get('year'),
        month: searchParams.get('month'),
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error.issues[0]?.message ?? 'Invalid query' },
          { status: 400 }
        );
      }

      const transactions = await transactionService.list(result.data);
      return NextResponse.json({ success: true, data: transactions });
    }

    if (hasRangeQuery) {
      const result = listTransactionsByRangeQuerySchema.safeParse({
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error.issues[0]?.message ?? 'Invalid query' },
          { status: 400 }
        );
      }

      const transactions = await transactionService.list({
        startDate: parseLocalDate(result.data.startDate),
        endDate: parseLocalDateEndOfDay(result.data.endDate),
      });
      return NextResponse.json({ success: true, data: transactions });
    }

    return NextResponse.json(
      { success: false, error: 'Missing transaction list query' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Transaction List Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list transactions' },
      { status: 500 }
    );
  }
}

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
