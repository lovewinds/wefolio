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
  onPrevMonth,
  onNextMonth,
}: MonthlySummaryProps) {
  const addTransactionUrl =
    year && month ? `/transactions/new?year=${year}&month=${month}` : '/transactions/new';

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onPrevMonth && (
            <button
              onClick={onPrevMonth}
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
              aria-label="이전 달"
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
            {currentMonth} 요약
          </h2>
          {onNextMonth && (
            <button
              onClick={onNextMonth}
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
              aria-label="다음 달"
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">총 수입</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatAmount(totalIncome)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">총 지출</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatAmount(totalExpense)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">잔액</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatAmount(balance)}
          </p>
        </Card>
      </div>
    </section>
  );
}
