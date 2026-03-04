'use client';

import { ResponsiveBar } from '@nivo/bar';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';

interface IncomeExpenseChartProps {
  totalIncome: number;
  totalExpense: number;
}

export function IncomeExpenseChart({ totalIncome, totalExpense }: IncomeExpenseChartProps) {
  const data = [
    {
      category: '이번 달',
      수입: totalIncome,
      지출: totalExpense,
    },
  ];

  return (
    <Card className="flex flex-col h-full">
      <h3 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-100">수입 vs 지출</h3>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveBar
          data={data}
          keys={['수입', '지출']}
          indexBy="category"
          margin={{ top: 10, right: 16, bottom: 32, left: 64 }}
          padding={0.3}
          innerPadding={16}
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
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor="#ffffff"
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
          }}
          legends={[
            {
              dataFrom: 'keys',
              anchor: 'top-right',
              direction: 'row',
              translateY: -20,
              itemWidth: 60,
              itemHeight: 20,
              itemTextColor: '#71717a',
              symbolSize: 12,
              symbolShape: 'circle',
            },
          ]}
        />
      </div>
    </Card>
  );
}
