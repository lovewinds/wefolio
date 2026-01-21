import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/mock-data';

interface MonthlySummaryProps {
  currentMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export function MonthlySummary({
  currentMonth,
  totalIncome,
  totalExpense,
  balance,
  onPrevMonth,
  onNextMonth,
}: MonthlySummaryProps) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2">
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
