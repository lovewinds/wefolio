import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/mock-data';

interface MonthlySummaryProps {
  currentMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function MonthlySummary({
  currentMonth,
  totalIncome,
  totalExpense,
  balance,
}: MonthlySummaryProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
        {currentMonth} 요약
      </h2>
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
