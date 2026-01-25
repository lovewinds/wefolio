import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { SummaryCard } from './summary-card';

interface MonthlySummaryProps {
  currentMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  year?: number;
  month?: number;
  titleSuffix?: string;
  detailUrl?: string;
  detailLabel?: string;
  navigationUnit?: 'month' | 'year';
  simplify?: boolean;
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
  titleSuffix = '요약',
  detailUrl,
  detailLabel = '상세 보기',
  navigationUnit = 'month',
  simplify = false,
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
            {monthDisplay ? ` ${monthDisplay}` : ''} {titleSuffix}
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
        <div className="flex flex-wrap items-center gap-2">
          {detailUrl && (
            <Link
              href={detailUrl}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {detailLabel}
            </Link>
          )}
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
      </div>
      <div className="grid gap-4">
        <Card className="border border-zinc-100/80 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:border-zinc-700/60 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                type="income"
                amount={totalIncome}
                ratio={incomeRatio}
                simplify={simplify}
              />
              <SummaryCard
                type="expense"
                amount={totalExpense}
                ratio={expenseRatio}
                simplify={simplify}
              />
              <SummaryCard type="balance" amount={balance} simplify={simplify} />
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
