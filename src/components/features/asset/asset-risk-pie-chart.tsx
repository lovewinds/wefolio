'use client';

import { useRouter } from 'next/navigation';
import { ResponsivePie } from '@nivo/pie';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import {
  RISK_LEVEL_COLORS,
  RISK_LEVEL_CHILD_PALETTES,
  DEFAULT_CHILD_COLORS,
} from '@/lib/constants';
import type { RiskGroup } from '@/types';

interface MemberFilterProps {
  members: string[];
  selectedMember: string | null;
  onMemberChange: (member: string | null) => void;
}

interface AssetRiskPieChartProps extends MemberFilterProps {
  data: RiskGroup[];
  totalValue: number;
  selectedYear?: number;
  selectedMonth?: number;
}

export function AssetRiskPieChart({
  data,
  totalValue,
  members,
  selectedMember,
  onMemberChange,
  selectedYear,
  selectedMonth,
}: AssetRiskPieChartProps) {
  const router = useRouter();

  // Inner donut: risk levels
  const innerData = data.map(group => ({
    id: group.riskLevel,
    label: group.riskLevel,
    value: group.totalValue,
    color: RISK_LEVEL_COLORS[group.riskLevel] ?? '#6b7280',
  }));

  // Outer donut: sub-classifications
  const outerData: {
    id: string;
    label: string;
    value: number;
    color: string;
    parentLabel: string;
  }[] = [];

  data.forEach(group => {
    const palette = RISK_LEVEL_CHILD_PALETTES[group.riskLevel] ?? DEFAULT_CHILD_COLORS;
    group.children.forEach((child, index) => {
      outerData.push({
        id: `${group.riskLevel}-${child.label}`,
        label: child.label,
        value: child.value,
        color: palette[index % palette.length],
        parentLabel: group.riskLevel,
      });
    });
  });

  const handleSegmentClick = (riskLevel: string) => {
    const params = new URLSearchParams();
    if (selectedYear) params.set('year', String(selectedYear));
    if (selectedMonth) params.set('month', String(selectedMonth));
    params.set('riskLevel', riskLevel);
    router.push(`/asset/portfolio?${params.toString()}`);
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">자산 구성 비율</h3>
        <div className="flex rounded-full bg-zinc-100 p-1 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
          {[{ value: null, label: '전체' }, ...members.map(m => ({ value: m, label: m }))].map(
            option => {
              const isActive = option.value === selectedMember;
              return (
                <button
                  key={option.label}
                  type="button"
                  className={`rounded-full px-3 py-1.5 transition ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white'
                  }`}
                  onClick={() => onMemberChange(option.value)}
                >
                  {option.label}
                </button>
              );
            }
          )}
        </div>
      </div>
      <div className="relative h-72">
        {/* Outer donut (sub-classifications) */}
        <div className="absolute inset-0">
          <ResponsivePie
            data={outerData}
            margin={{ top: 24, right: 100, bottom: 24, left: 24 }}
            innerRadius={0.55}
            padAngle={0.5}
            cornerRadius={2}
            activeOuterRadiusOffset={6}
            colors={d => d.data.color}
            borderWidth={0}
            enableArcLinkLabels={true}
            arcLinkLabelsSkipAngle={12}
            arcLinkLabelsTextColor="#52525b"
            arcLinkLabelsThickness={1.5}
            arcLinkLabelsDiagonalLength={10}
            arcLinkLabelsStraightLength={8}
            arcLinkLabelsTextOffset={4}
            arcLinkLabel={datum => String(datum.label)}
            arcLinkLabelsColor={{ from: 'color' }}
            enableArcLabels={false}
            onClick={datum => handleSegmentClick(datum.data.parentLabel)}
            tooltip={({ datum }) => (
              <div className="rounded-md bg-white px-3 py-2 shadow-lg dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: datum.color }} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {datum.data.parentLabel} &gt; {datum.label}
                  </span>
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {formatAmount(datum.value)} (
                  {totalValue > 0 ? ((datum.value / totalValue) * 100).toFixed(1) : '0'}
                  %)
                </div>
              </div>
            )}
          />
        </div>

        {/* Inner donut (risk levels) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[45%] w-[45%]" style={{ marginRight: '76px' }}>
            <ResponsivePie
              data={innerData}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              innerRadius={0}
              padAngle={1}
              cornerRadius={2}
              colors={d => d.data.color}
              borderWidth={0}
              enableArcLinkLabels={false}
              enableArcLabels={true}
              arcLabelsSkipAngle={25}
              arcLabelsTextColor="#ffffff"
              arcLabel={d => String(d.label)}
              isInteractive={false}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map(group => (
          <button
            key={group.riskLevel}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={() => handleSegmentClick(group.riskLevel)}
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: RISK_LEVEL_COLORS[group.riskLevel] ?? '#6b7280' }}
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {group.riskLevel} {group.percentage}%
            </span>
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
        총 자산: {formatAmount(totalValue)}
      </div>
    </Card>
  );
}
