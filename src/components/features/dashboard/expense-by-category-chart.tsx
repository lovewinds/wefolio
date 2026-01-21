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
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={{ scheme: 'paired' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#71717a"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor="#ffffff"
          valueFormat={v => formatAmount(v)}
        />
      </div>
    </Card>
  );
}
