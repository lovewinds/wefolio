import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/mock-data';

interface MonthlySummaryProps {
  currentMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  year?: number;
  month?: number;
  navigationUnit?: 'month' | 'year';
  onToggleNavigationUnit?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export function MonthlySummary({
  currentMonth,
  totalIncome,
  totalExpense,
  balance,
  year,
  month,
  navigationUnit = 'month',
  onToggleNavigationUnit,
  canPrev = true,
  canNext = true,
  onPrevMonth,
  onNextMonth,
}: MonthlySummaryProps) {
  const addTransactionUrl =
    year && month ? `/transactions/new?year=${year}&month=${month}` : '/transactions/new';
  const totalFlow = totalIncome + totalExpense;
  const incomeRatio = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 50;
  const expenseRatio = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 50;
  const yearLabel = year ? `${year}년` : null;
  const monthLabel = month ? `${month}월` : null;
  const isYearMode = navigationUnit === 'year';
  const showSeparatedDate = Boolean(yearLabel && monthLabel);
  const showClickableYear = Boolean(showSeparatedDate && onToggleNavigationUnit);
  const monthDisplay = showSeparatedDate ? monthLabel : currentMonth;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onPrevMonth && (
            <button
              onClick={onPrevMonth}
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-700"
              aria-label="이전 달"
              disabled={!canPrev}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            {showClickableYear ? (
              <button
                type="button"
                onClick={onToggleNavigationUnit}
                className={`rounded-md px-1 py-0.5 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 ${
                  isYearMode
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-zinc-800 dark:text-zinc-100'
                }`}
                aria-pressed={isYearMode}
              >
                {yearLabel}
              </button>
            ) : (
              yearLabel
            )}
            {monthDisplay ? ` ${monthDisplay}` : ''} 요약
          </h2>
          {onNextMonth && (
            <button
              onClick={onNextMonth}
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-700"
              aria-label="다음 달"
              disabled={!canNext}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
        <Link
          href={addTransactionUrl}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          거래 추가
        </Link>
      </div>
      <div className="grid gap-4">
        <Card className="border border-zinc-100/80 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:border-zinc-700/60 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">
                  수입
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
                  {formatAmount(totalIncome)}
                </p>
                <p className="mt-1 text-xs text-emerald-700/70 dark:text-emerald-300/70">
                  전체의 {Math.round(incomeRatio)}%
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200/60 bg-rose-50/80 p-4 dark:border-rose-900/60 dark:bg-rose-950/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">
                  지출
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-rose-700 dark:text-rose-300">
                  {formatAmount(totalExpense)}
                </p>
                <p className="mt-1 text-xs text-rose-700/70 dark:text-rose-300/70">
                  전체의 {Math.round(expenseRatio)}%
                </p>
              </div>
              <div className="rounded-2xl border border-blue-200/50 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  잔액
                </p>
                <p
                  className={`mt-1 text-2xl font-semibold tracking-tight ${
                    balance >= 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatAmount(balance)}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">수입 - 지출</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
