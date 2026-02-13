import { NextResponse } from 'next/server';
import { z } from 'zod';
import { transactionService } from '@/services/transaction-service';

const optionsQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = optionsQuerySchema.safeParse({
      type: searchParams.get('type') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const data = await transactionService.getInputOptions(parsed.data.type);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Transaction Options API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction options' },
      { status: 500 }
    );
  }
}
