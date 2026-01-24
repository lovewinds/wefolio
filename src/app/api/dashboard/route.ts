import { NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction-service';
import type {
  DashboardData,
  DashboardTransaction,
  CategoryExpense,
  HierarchicalCategoryExpense,
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);

    const dbTransactions = (await transactionService.getByMonth(
      year,
      month
    )) as unknown as TransactionWithCategory[];

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

    // Calculate expense by category (flat list with parent info)
    const expenseByCategory: CategoryExpense[] = dbTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const categoryName = t.category?.name ?? 'Unknown';
        const parentName = t.category?.parent?.name;
        const existing = acc.find(item => item.id === categoryName);
        if (existing) {
          existing.value += t.amount;
        } else {
          acc.push({
            id: categoryName,
            label: categoryName,
            value: t.amount,
            parentId: t.category?.parentId ?? null,
            parentLabel: parentName,
            color: t.category?.color ?? undefined,
          });
        }
        return acc;
      }, [] as CategoryExpense[])
      .sort((a, b) => b.value - a.value);

    // Build hierarchical structure for sunburst chart
    const expenseByParentCategory = buildHierarchicalExpense(dbTransactions);

    const data: DashboardData & { expenseByParentCategory: HierarchicalCategoryExpense[] } = {
      stats: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
      transactions,
      expenseByCategory,
      expenseByParentCategory,
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

function buildHierarchicalExpense(
  transactions: TransactionWithCategory[]
): HierarchicalCategoryExpense[] {
  const parentMap = new Map<
    string,
    {
      id: string;
      label: string;
      color: string | undefined;
      children: Map<
        string,
        { id: string; label: string; value: number; color: string | undefined }
      >;
    }
  >();

  // Filter expense transactions
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  for (const tx of expenseTransactions) {
    const category = tx.category;
    if (!category) continue;

    // Determine parent category
    const parentId = category.parent?.id ?? category.id;
    const parentName = category.parent?.name ?? category.name;
    const parentColor = category.parent?.color ?? category.color ?? undefined;

    // Get or create parent entry
    if (!parentMap.has(parentId)) {
      parentMap.set(parentId, {
        id: parentId,
        label: parentName,
        color: parentColor,
        children: new Map(),
      });
    }

    const parent = parentMap.get(parentId)!;

    // If this is a child category, add to children
    if (category.parent) {
      const childId = category.id;
      const childName = category.name;
      const childColor = category.color ?? undefined;

      if (!parent.children.has(childId)) {
        parent.children.set(childId, {
          id: childId,
          label: childName,
          value: 0,
          color: childColor,
        });
      }
      parent.children.get(childId)!.value += tx.amount;
    }
  }

  // Convert to array format
  const result: HierarchicalCategoryExpense[] = [];

  for (const [, parent] of parentMap) {
    const children = Array.from(parent.children.values())
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalValue = children.reduce((sum, c) => sum + c.value, 0);

    if (totalValue > 0) {
      result.push({
        id: parent.id,
        label: parent.label,
        value: totalValue,
        color: parent.color,
        children: children.length > 0 ? children : undefined,
      });
    }
  }

  return result.sort((a, b) => b.value - a.value);
}
