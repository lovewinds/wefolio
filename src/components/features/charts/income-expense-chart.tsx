'use client';

import { ResponsiveBar } from '@nivo/bar';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';

interface IncomeExpenseChartProps {
  totalIncome: number;
  totalExpense: number;
}

export function IncomeExpenseChart({ totalIncome, totalExpense }: IncomeExpenseChartProps) {
  const hasData = totalIncome > 0 || totalExpense > 0;
  const data = [
    {
      category: '이번 달',
      수입: totalIncome,
      지출: totalExpense,
    },
  ];

  return (
    <Card className="flex h-full min-h-[360px] flex-col border border-zinc-100 shadow-sm dark:border-zinc-700">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">수입 vs 지출</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">총수입과 총지출 비교</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            수입 {formatAmount(totalIncome)}
          </span>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            지출 {formatAmount(totalExpense)}
          </span>
        </div>
      </div>

      {hasData ? (
        <div className="min-h-[240px] flex-1">
          <ResponsiveBar
            data={data}
            keys={['수입', '지출']}
            indexBy="category"
            margin={{ top: 16, right: 16, bottom: 32, left: 64 }}
            padding={0.28}
            innerPadding={12}
            groupMode="grouped"
            colors={['#10b981', '#f43f5e']}
            borderRadius={4}
            gridYValues={5}
            axisBottom={{
              tickSize: 0,
              tickPadding: 10,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              tickValues: 5,
              format: v => `${(Number(v) / 10000).toFixed(0)}만`,
            }}
            enableLabel={false}
            valueFormat={v => formatAmount(v)}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fill: '#71717a',
                  },
                },
              },
              grid: {
                line: {
                  stroke: '#e4e4e7',
                },
              },
              tooltip: {
                container: {
                  color: '#18181b',
                },
              },
            }}
          />
        </div>
      ) : (
        <div className="flex min-h-[240px] flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 px-4 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              이번 달 수입/지출 거래가 없습니다.
            </p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              거래가 생기면 비교 차트가 표시됩니다.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
