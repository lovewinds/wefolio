import { NextRequest, NextResponse } from 'next/server';
import { yearMonthSchema } from '@/lib/validations/common';
import { createHoldingTransactionSchema } from '@/lib/validations/holding-transaction';
import { holdingTransactionService } from '@/services/holding-service';
import { HOLDING_TRANSACTION_TYPE_LABELS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = yearMonthSchema.safeParse({
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing year/month parameters' },
        { status: 400 }
      );
    }

    const { year, month } = parsed.data;
    const transactions = await holdingTransactionService.getAllByMonth(year, month);

    const data = transactions.map(tx => ({
      id: tx.id,
      date: tx.date.toISOString().slice(0, 10),
      holdingId: tx.holdingId,
      transactionType: tx.transactionType,
      transactionTypeLabel:
        HOLDING_TRANSACTION_TYPE_LABELS[tx.transactionType] ?? tx.transactionType,
      quantity: Math.abs(tx.quantity),
      priceOriginal: tx.priceOriginal,
      priceKRW: tx.priceKRW,
      exchangeRate: tx.exchangeRate,
      totalKRW: tx.totalKRW,
      fees: tx.fees,
      notes: tx.notes,
      assetName: tx.holding.assetMaster.name,
      currency: tx.holding.assetMaster.currency,
      accountName: tx.holding.account.name,
      memberName: tx.holding.account.member.name,
      institutionName: tx.holding.account.institution.name,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Asset Transactions GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createHoldingTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const {
      holdingId,
      transactionType,
      date,
      quantity,
      priceOriginal,
      priceKRW,
      exchangeRate,
      fees,
      notes,
    } = parsed.data;

    const transaction = await holdingTransactionService.record(
      holdingId,
      transactionType,
      new Date(date + 'T00:00:00.000Z'),
      quantity,
      priceOriginal,
      priceKRW,
      exchangeRate,
      fees,
      notes
    );

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Asset Transactions POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create asset transaction' },
      { status: 500 }
    );
  }
}
