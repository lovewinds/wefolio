import { formatAmount } from '@/lib/format-utils';
import { SummaryCard } from './budget-card';

interface SummaryCardGroupProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  simplify?: boolean;
  vertical?: boolean;
  inline?: boolean;
}

export function SummaryCardGroup({
  totalIncome,
  totalExpense,
  balance,
  simplify = false,
  vertical = false,
  inline = false,
}: SummaryCardGroupProps) {
  const totalFlow = totalIncome + totalExpense;
  const incomeRatio = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 50;
  const expenseRatio = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 50;
  const balanceTone =
    balance < 0
      ? {
          label: '초과 지출',
          container:
            'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-100',
          amount: 'text-rose-700 dark:text-rose-300',
          sub: 'text-rose-700/70 dark:text-rose-300/70',
        }
      : {
          label: balance === 0 ? '수지 균형' : '월간 잔액',
          container:
            'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900/70 dark:bg-blue-950/35 dark:text-blue-100',
          amount: 'text-blue-700 dark:text-blue-300',
          sub: 'text-blue-700/70 dark:text-blue-300/70',
        };

  if (inline) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard type="income" amount={totalIncome} compact simplify />
        <SummaryCard type="expense" amount={totalExpense} compact simplify />
        <SummaryCard type="balance" amount={balance} compact simplify />
      </div>
    );
  }

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
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className={`min-w-0 rounded-xl border p-5 shadow-sm sm:p-6 ${balanceTone.container}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{balanceTone.label}</p>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
            수입 - 지출
          </span>
        </div>
        <p
          className={`mt-3 min-w-0 break-words text-3xl font-semibold tracking-normal [overflow-wrap:anywhere] sm:text-4xl ${balanceTone.amount}`}
        >
          {formatAmount(balance)}
        </p>
        <p className={`mt-2 text-sm ${balanceTone.sub}`}>이번 달 현금흐름 결과</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <MetricCard
          label="총수입"
          amount={totalIncome}
          ratio={incomeRatio}
          tone="income"
          simplify={simplify}
        />
        <MetricCard
          label="총지출"
          amount={totalExpense}
          ratio={expenseRatio}
          tone="expense"
          simplify={simplify}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  amount,
  ratio,
  tone,
  simplify,
}: {
  label: string;
  amount: number;
  ratio: number;
  tone: 'income' | 'expense';
  simplify: boolean;
}) {
  const toneClass =
    tone === 'income'
      ? {
          container: 'border-emerald-200 bg-white dark:border-emerald-900/70 dark:bg-zinc-800',
          label: 'text-emerald-700 dark:text-emerald-300',
          amount: 'text-emerald-700 dark:text-emerald-300',
          bar: 'bg-emerald-500',
        }
      : {
          container: 'border-rose-200 bg-white dark:border-rose-900/70 dark:bg-zinc-800',
          label: 'text-rose-700 dark:text-rose-300',
          amount: 'text-rose-700 dark:text-rose-300',
          bar: 'bg-rose-500',
        };

  return (
    <div className={`min-w-0 rounded-xl border p-4 shadow-sm ${toneClass.container}`}>
      {!simplify && <p className={`text-sm font-semibold ${toneClass.label}`}>{label}</p>}
      <p
        className={`mt-2 min-w-0 break-words text-2xl font-semibold tracking-normal [overflow-wrap:anywhere] ${toneClass.amount}`}
      >
        {formatAmount(amount)}
      </p>
      {!simplify && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>현금흐름 비중</span>
            <span>{Math.round(ratio)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
            <div
              className={`h-full rounded-full ${toneClass.bar}`}
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
