'use client';

import { ResponsivePie } from '@nivo/pie';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/mock-data';

interface ExpenseCategory {
  id: string;
  label: string;
  value: number;
}

interface ExpenseByCategoryChartProps {
  data: ExpenseCategory[];
}

export function ExpenseByCategoryChart({ data }: ExpenseByCategoryChartProps) {
  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        카테고리별 지출
      </h3>
      <div className="h-64">
        <ResponsivePie
          data={data}
          margin={{ top: 24, right: 48, bottom: 28, left: 48 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={{ scheme: 'set3' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#52525b"
          arcLinkLabelsThickness={2}
          arcLinkLabelsDiagonalLength={14}
          arcLinkLabelsStraightLength={12}
          arcLinkLabelsTextOffset={6}
          arcLinkLabel={datum => formatAmount(datum.value)}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={14}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2.6]] }}
          arcLabel="label"
          valueFormat={v => formatAmount(v)}
        />
      </div>
    </Card>
  );
}
