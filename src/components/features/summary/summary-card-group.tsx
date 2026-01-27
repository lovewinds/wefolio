import { Card } from '@/components/ui/card';
import { SummaryCard } from './summary-card';

interface SummaryCardGroupProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  simplify?: boolean;
}

export function SummaryCardGroup({
  totalIncome,
  totalExpense,
  balance,
  simplify = false,
}: SummaryCardGroupProps) {
  const totalFlow = totalIncome + totalExpense;
  const incomeRatio = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 50;
  const expenseRatio = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 50;

  return (
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
  );
}
