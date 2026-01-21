'use client';

import { ResponsiveBar } from '@nivo/bar';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/mock-data';

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
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">수입 vs 지출</h3>
      <div className="h-64">
        <ResponsiveBar
          data={data}
          keys={['수입', '지출']}
          indexBy="category"
          margin={{ top: 20, right: 20, bottom: 40, left: 80 }}
          padding={0.3}
          groupMode="grouped"
          colors={['#10b981', '#f43f5e']}
          borderRadius={4}
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 10,
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
