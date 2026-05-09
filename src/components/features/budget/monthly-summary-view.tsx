'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { List, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { MonthSelector } from '@/components/features/navigation';
import { SummaryCardGroup, CategoryTransactionDetail } from '@/components/features/budget';
import { IncomeExpenseChart, CategoryBreakdownChart } from '@/components/features/charts';
import { MonthlyDetailTable, RecentTransactions } from '@/components/features/transaction';
import { TransactionInputPanel } from '@/components/features/transaction-input';
import { PageContainer } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';
import type { DashboardData, TransactionListData } from '@/types';

interface MonthlySummaryViewProps {
  initialData: DashboardData;
  initialYear: number;
  initialMonth: number;
}

type CategoryType = 'income' | 'expense';
type BudgetMonthlyView = 'summary' | 'detail';

const DEFAULT_PAYMENT_METHODS: string[] = [];
const DEFAULT_USERS: string[] = [];

interface SelectedCategory {
  id: string;
  label: string;
  isParent: boolean;
  parentId?: string;
  parentLabel?: string;
  categoryType: CategoryType;
}

function parseBudgetMonthlyView(value: string | null): BudgetMonthlyView {
  return value === 'detail' ? 'detail' : 'summary';
}

export function MonthlySummaryView({
  initialData,
  initialYear,
  initialMonth,
}: MonthlySummaryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<DashboardData>(initialData);
  const [transactionData, setTransactionData] = useState<TransactionListData>({
    transactions: initialData.transactions,
    availableRange: initialData.availableRange,
  });
  const [isFetching, setIsFetching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategory | null>(null);
  const [activeChartType, setActiveChartType] = useState<CategoryType>('expense');
  const [activeView, setActiveView] = useState<BudgetMonthlyView>(() =>
    parseBudgetMonthlyView(searchParams.get('view'))
  );
  const [isInputOpen, setIsInputOpen] = useState(() => searchParams.get('input') === 'open');
  const [optionCache, setOptionCache] = useState(() => ({
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    users: DEFAULT_USERS,
  }));

  const {
    selectedYear,
    selectedMonth,
    handlePrevMonth,
    handleNextMonth,
    setSelectedDate,
    canMovePrev,
    canMoveNext,
    updateRangeFromData,
  } = useMonthNavigation({
    initialFromQuery: {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    },
    allowFutureNavigation: true,
  });

  const replaceMonthlyQuery = useCallback(
    ({
      year = selectedYear,
      month = selectedMonth,
      view = activeView,
      inputOpen = isInputOpen,
    }: {
      year?: number;
      month?: number;
      view?: BudgetMonthlyView;
      inputOpen?: boolean;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('year', String(year));
      params.set('month', String(month));
      params.set('view', view);

      if (inputOpen) {
        params.set('input', 'open');
      } else {
        params.delete('input');
      }

      const nextQuery = params.toString();
      if (nextQuery !== searchParams.toString()) {
        router.replace(`${pathname}?${nextQuery}`, { scroll: false });
      }
    },
    [activeView, isInputOpen, pathname, router, searchParams, selectedMonth, selectedYear]
  );

  const handleSelectDate = useCallback(
    (year: number, month: number) => {
      setSelectedDate({ year, month });
      replaceMonthlyQuery({ year, month });
    },
    [replaceMonthlyQuery, setSelectedDate]
  );

  const handlePrevMonthWithQuery = useCallback(() => {
    const nextYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const nextMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    handlePrevMonth();
    replaceMonthlyQuery({ year: nextYear, month: nextMonth });
  }, [handlePrevMonth, replaceMonthlyQuery, selectedMonth, selectedYear]);

  const handleNextMonthWithQuery = useCallback(() => {
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    handleNextMonth();
    replaceMonthlyQuery({ year: nextYear, month: nextMonth });
  }, [handleNextMonth, replaceMonthlyQuery, selectedMonth, selectedYear]);

  const loadData = useCallback(async () => {
    try {
      setIsFetching(true);
      const [dashboardData, listData] = await Promise.all([
        apiClient.dashboard.getMonthly(selectedYear, selectedMonth),
        apiClient.transactions.list<TransactionListData>({
          year: selectedYear,
          month: selectedMonth,
        }),
      ]);
      setData(dashboardData);
      setTransactionData(listData);
      setSelectedCategory(null);
    } catch {
      // Keep previous data on error
    } finally {
      setIsFetching(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const nextView = parseBudgetMonthlyView(searchParams.get('view'));
    const nextInputOpen = searchParams.get('input') === 'open';

    setActiveView(currentView => (currentView === nextView ? currentView : nextView));
    setIsInputOpen(currentInputOpen =>
      currentInputOpen === nextInputOpen ? currentInputOpen : nextInputOpen
    );
  }, [searchParams]);

  useEffect(() => {
    if (selectedYear === initialYear && selectedMonth === initialMonth) return;
    loadData();
  }, [selectedYear, selectedMonth, initialYear, initialMonth, loadData]);

  useEffect(() => {
    updateRangeFromData(
      transactionData.availableRange ?? data.availableRange ?? null,
      transactionData.transactions.length > 0 ? transactionData.transactions : data.transactions
    );
  }, [data, transactionData, updateRangeFromData]);

  useEffect(() => {
    setOptionCache(prev => {
      const paymentMethods = new Set(prev.paymentMethods);
      const users = new Set(prev.users);

      transactionData.transactions.forEach(transaction => {
        if (transaction.paymentMethod) paymentMethods.add(transaction.paymentMethod);
        if (transaction.user) users.add(transaction.user);
      });

      return {
        paymentMethods: Array.from(paymentMethods),
        users: Array.from(users),
      };
    });
  }, [transactionData.transactions]);

  const { stats, transactions, expenseByParentCategory, incomeByParentCategory } = data;
  const { totalIncome, totalExpense, balance } = stats;
  const categoryChartData = {
    expense: expenseByParentCategory ?? [],
    income: incomeByParentCategory ?? [],
  };

  return (
    <PageContainer isFetching={isFetching}>
      <MonthSelector
        year={selectedYear}
        month={selectedMonth}
        titleSuffix="요약"
        canPrev={canMovePrev}
        canNext={canMoveNext}
        onPrevMonth={handlePrevMonthWithQuery}
        onNextMonth={handleNextMonthWithQuery}
        onYearChange={y => handleSelectDate(y, selectedMonth)}
        onMonthChange={m => handleSelectDate(selectedYear, m)}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'summary'}
            onClick={() => {
              setActiveView('summary');
              replaceMonthlyQuery({ view: 'summary' });
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeView === 'summary'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            요약
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'detail'}
            onClick={() => {
              setActiveView('detail');
              setSelectedCategory(null);
              replaceMonthlyQuery({ view: 'detail' });
            }}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeView === 'detail'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <List size={15} aria-hidden="true" />
            거래 목록
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsInputOpen(true);
            replaceMonthlyQuery({ inputOpen: true });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus size={16} aria-hidden="true" />
          거래 추가
        </button>
      </div>

      {activeView === 'summary' && (
        <div className="space-y-4" role="tabpanel">
          <SummaryCardGroup
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
            <IncomeExpenseChart totalIncome={totalIncome} totalExpense={totalExpense} />
            <CategoryBreakdownChart
              dataByType={categoryChartData}
              value={activeChartType}
              onValueChange={type => {
                setActiveChartType(type);
                setSelectedCategory(null);
              }}
              onItemClick={item => setSelectedCategory({ ...item, categoryType: activeChartType })}
              selectedItemId={selectedCategory?.id}
            />
          </div>

          <RecentTransactions transactions={transactionData.transactions} limit={5} />
        </div>
      )}

      {activeView === 'summary' && selectedCategory && (
        <div className="mt-4">
          <CategoryTransactionDetail
            label={selectedCategory.label}
            isParent={selectedCategory.isParent}
            parentLabel={selectedCategory.parentLabel}
            categoryType={selectedCategory.categoryType}
            transactions={transactions}
            categoryExpenses={
              selectedCategory.categoryType === 'expense'
                ? (data.expenseByCategory ?? [])
                : (data.incomeByCategory ?? [])
            }
            onClose={() => setSelectedCategory(null)}
          />
        </div>
      )}

      {activeView === 'detail' && (
        <div role="tabpanel">
          <MonthlyDetailTable
            transactions={transactionData.transactions}
            year={selectedYear}
            month={selectedMonth}
            paymentMethods={optionCache.paymentMethods}
            users={optionCache.users}
            onDataChange={loadData}
          />
        </div>
      )}

      <TransactionInputPanel
        open={isInputOpen}
        year={selectedYear}
        month={selectedMonth}
        onClose={() => {
          setIsInputOpen(false);
          replaceMonthlyQuery({ inputOpen: false });
        }}
        onDataChange={loadData}
      />
    </PageContainer>
  );
}
