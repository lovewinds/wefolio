import { NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction-service';
import type { DashboardData, DashboardTransaction, CategoryExpense } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);

    const dbTransactions = await transactionService.getByMonth(year, month);

    // Transform to dashboard format
    const transactions: DashboardTransaction[] = dbTransactions.map(tx => {
      const category = tx as unknown as { category: { name: string } };
      return {
        id: tx.id,
        type: tx.type as 'income' | 'expense',
        amount: tx.amount,
        category: category.category?.name ?? 'Unknown',
        description: tx.description ?? undefined,
        date: tx.date.toISOString().split('T')[0],
      };
    });

    // Calculate stats
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate expense by category
    const expenseByCategory: CategoryExpense[] = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.id === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          acc.push({ id: t.category, label: t.category, value: t.amount });
        }
        return acc;
      }, [] as CategoryExpense[])
      .sort((a, b) => b.value - a.value);

    const data: DashboardData = {
      stats: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
      transactions,
      expenseByCategory,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
