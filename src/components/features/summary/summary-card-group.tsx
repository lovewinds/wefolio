import { Card } from '@/components/ui/card';
import { SummaryCard } from './summary-card';

interface SummaryCardGroupProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  simplify?: boolean;
  vertical?: boolean;
}

export function SummaryCardGroup({
  totalIncome,
  totalExpense,
  balance,
  simplify = false,
  vertical = false,
}: SummaryCardGroupProps) {
  const totalFlow = totalIncome + totalExpense;
  const incomeRatio = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 50;
  const expenseRatio = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 50;

  if (vertical) {
    return (
      <div className="grid grid-cols-1 gap-2">
        <SummaryCard type="income" amount={totalIncome} ratio={incomeRatio} compact />
        <SummaryCard type="expense" amount={totalExpense} ratio={expenseRatio} compact />
        <SummaryCard type="balance" amount={balance} compact />
      </div>
    );
  }

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
