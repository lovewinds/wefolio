import { NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction-service';
import { categoryRepository } from '@/repositories/category-repository';
import type {
  DashboardData,
  DashboardTransaction,
  CategoryExpense,
  HierarchicalCategoryExpense,
  DashboardMonthRange,
} from '@/types';

interface TransactionWithCategory {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: Date;
  category: {
    id: string;
    name: string;
    color: string | null;
    parentId: string | null;
    parent?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
}

interface CategoryNode {
  id: string;
  name: string;
  color: string | null;
  parentId: string | null;
  children?: CategoryNode[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);

    const dateRange = await transactionService.getDateRange();
    const dbTransactions = (await transactionService.getByMonth(
      year,
      month
    )) as unknown as TransactionWithCategory[];
    const [expenseCategories, incomeCategories] = await Promise.all([
      categoryRepository.findParentsByType('expense'),
      categoryRepository.findParentsByType('income'),
    ]);

    // Transform to dashboard format
    const transactions: DashboardTransaction[] = dbTransactions.map(tx => {
      return {
        id: tx.id,
        type: tx.type as 'income' | 'expense',
        amount: tx.amount,
        category: tx.category?.name ?? 'Unknown',
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

    const expenseBreakdown = buildCategoryBreakdown(
      dbTransactions,
      expenseCategories as CategoryNode[],
      'expense'
    );
    const incomeBreakdown = buildCategoryBreakdown(
      dbTransactions,
      incomeCategories as CategoryNode[],
      'income'
    );

    const availableRange: DashboardMonthRange | undefined =
      dateRange.min && dateRange.max
        ? {
            min: {
              year: dateRange.min.getFullYear(),
              month: dateRange.min.getMonth() + 1,
            },
            max: {
              year: dateRange.max.getFullYear(),
              month: dateRange.max.getMonth() + 1,
            },
          }
        : undefined;

    const data: DashboardData = {
      stats: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
      transactions,
      expenseByCategory: expenseBreakdown.flat,
      incomeByCategory: incomeBreakdown.flat,
      expenseByParentCategory: expenseBreakdown.hierarchical,
      incomeByParentCategory: incomeBreakdown.hierarchical,
      availableRange,
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

function buildCategoryBreakdown(
  transactions: TransactionWithCategory[],
  categories: CategoryNode[],
  type: 'income' | 'expense'
): { flat: CategoryExpense[]; hierarchical: HierarchicalCategoryExpense[] } {
  const totals = new Map<string, number>();

  for (const transaction of transactions.filter(tx => tx.type === type)) {
    const category = transaction.category;
    if (!category) continue;
    totals.set(category.id, (totals.get(category.id) ?? 0) + transaction.amount);
  }

  const metaById = new Map<string, CategoryNode>();
  const parentById = new Map<string, CategoryNode>();

  for (const parent of categories) {
    parentById.set(parent.id, parent);
    metaById.set(parent.id, parent);
    for (const child of parent.children ?? []) {
      metaById.set(child.id, { ...child, parentId: parent.id });
    }
  }

  const flat = Array.from(totals.entries())
    .map(([id, value]) => {
      const meta = metaById.get(id);
      if (!meta) return null;
      const parent = meta.parentId ? parentById.get(meta.parentId) : undefined;
      return {
        id,
        label: meta.name,
        value,
        parentId: meta.parentId ?? null,
        parentLabel: parent?.name,
        color: meta.color ?? parent?.color ?? undefined,
      } as CategoryExpense;
    })
    .filter((item): item is CategoryExpense => !!item && item.value > 0)
    .sort((a, b) => b.value - a.value);

  const hierarchical: HierarchicalCategoryExpense[] = [];

  for (const parent of categories) {
    const children = (parent.children ?? [])
      .map(child => ({
        id: child.id,
        label: child.name,
        value: totals.get(child.id) ?? 0,
        color: child.color ?? undefined,
      }))
      .filter(child => child.value > 0)
      .sort((a, b) => b.value - a.value);

    if (children.length > 0) {
      const totalValue = children.reduce((sum, child) => sum + child.value, 0);
      if (totalValue > 0) {
        hierarchical.push({
          id: parent.id,
          label: parent.name,
          value: totalValue,
          color: parent.color ?? undefined,
          children,
        });
      }
      continue;
    }

    const parentValue = totals.get(parent.id) ?? 0;
    if (parentValue > 0) {
      hierarchical.push({
        id: parent.id,
        label: parent.name,
        value: parentValue,
        color: parent.color ?? undefined,
      });
    }
  }

  return {
    flat,
    hierarchical: hierarchical.sort((a, b) => b.value - a.value),
  };
}
