'use client';

import { useMemo } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import { ChevronRight } from 'lucide-react';

export interface DrillDownNode {
  id: string;
  label: string;
  value: number;
  color?: string;
  children?: DrillDownNode[];
}

interface DrillDownPieChartProps {
  data: DrillDownNode[];
  breadcrumb: { label: string; index: number }[];
  onDrillDown: (nodeId: string) => void;
  onBreadcrumbClick: (index: number) => void;
  totalValue: number;
}

const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f97316',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#84cc16',
  '#f43f5e',
  '#6366f1',
];

export function DrillDownPieChart({
  data,
  breadcrumb,
  onDrillDown,
  onBreadcrumbClick,
  totalValue,
}: DrillDownPieChartProps) {
  const pieData = useMemo(() => {
    return data.map((node, index) => ({
      id: node.id,
      label: node.label,
      value: node.value,
      color: node.color ?? PALETTE[index % PALETTE.length],
      hasChildren: (node.children?.length ?? 0) > 0,
    }));
  }, [data]);

  return (
    <Card>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1 text-sm">
        {breadcrumb.map((crumb, idx) => (
          <span key={crumb.index} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight size={14} className="text-zinc-400" />}
            <button
              type="button"
              onClick={() => onBreadcrumbClick(crumb.index)}
              className={`rounded px-1.5 py-0.5 transition-colors ${
                idx === breadcrumb.length - 1
                  ? 'font-semibold text-zinc-900 dark:text-zinc-50'
                  : 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-zinc-800'
              }`}
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </div>

      {/* Pie chart */}
      <div className="h-80">
        {pieData.length > 0 ? (
          <ResponsivePie
            data={pieData}
            margin={{ top: 24, right: 100, bottom: 24, left: 24 }}
            innerRadius={0.45}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={d => d.data.color}
            borderWidth={0}
            enableArcLinkLabels={true}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#52525b"
            arcLinkLabelsThickness={1.5}
            arcLinkLabelsDiagonalLength={10}
            arcLinkLabelsStraightLength={8}
            arcLinkLabelsTextOffset={4}
            arcLinkLabel={datum => String(datum.label)}
            arcLinkLabelsColor={{ from: 'color' }}
            enableArcLabels={true}
            arcLabelsSkipAngle={15}
            arcLabelsTextColor="#ffffff"
            arcLabel={d => `${((d.value / totalValue) * 100).toFixed(1)}%`}
            onClick={datum => {
              if (datum.data.hasChildren) {
                onDrillDown(String(datum.id));
              }
            }}
            tooltip={({ datum }) => (
              <div className="rounded-md bg-white px-3 py-2 shadow-lg dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: datum.color }} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {datum.label}
                  </span>
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {formatAmount(datum.value)} (
                  {totalValue > 0 ? ((datum.value / totalValue) * 100).toFixed(1) : '0'}
                  %)
                </div>
                {datum.data.hasChildren && (
                  <p className="mt-1 text-xs text-blue-500">클릭하여 상세 보기</p>
                )}
              </div>
            )}
            theme={{
              labels: { text: { fontSize: 11 } },
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            데이터가 없습니다.
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {pieData.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => item.hasChildren && onDrillDown(item.id)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              item.hasChildren ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700' : ''
            }`}
          >
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-zinc-600 dark:text-zinc-400">
              {item.label} {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0}%
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
