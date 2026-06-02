'use client';

import { useMemo, useState } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import { nivoTheme } from '@/lib/chart-theme';
import type { AssetTrendEntry } from '@/types';

interface AssetTotalTrendChartProps {
  data: AssetTrendEntry[];
}

const MEMBER_COLORS = ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#ec4899'];

export function AssetTotalTrendChart({ data }: AssetTotalTrendChartProps) {
  const [showByMember, setShowByMember] = useState(false);

  const members = useMemo(() => {
    const set = new Set<string>();
    for (const entry of data) {
      for (const m of entry.byMember) set.add(m.name);
    }
    return Array.from(set).sort();
  }, [data]);

  const yTickValues = useMemo(() => {
    const allValues = data.flatMap(entry =>
      showByMember ? entry.byMember.map(m => m.value) : [entry.totalValue]
    );
    if (allValues.length === 0) return [];
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const unit = 50_000_000; // 0.5억
    const start = Math.floor(minVal / unit) * unit;
    const end = Math.ceil(maxVal / unit) * unit;
    const ticks: number[] = [];
    for (let v = start; v <= end; v += unit) {
      ticks.push(v);
    }
    return ticks;
  }, [data, showByMember]);

  const chartData = useMemo(() => {
    if (!showByMember || members.length === 0) {
      return [
        {
          id: '총 자산',
          color: 'var(--accent)',
          data: data.map(entry => ({
            x: `${entry.year}.${String(entry.month).padStart(2, '0')}`,
            y: entry.totalValue,
          })),
        },
      ];
    }

    return members.map((member, idx) => ({
      id: member,
      color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
      data: data.map(entry => {
        const memberData = entry.byMember.find(m => m.name === member);
        return {
          x: `${entry.year}.${String(entry.month).padStart(2, '0')}`,
          y: memberData?.value ?? 0,
        };
      }),
    }));
  }, [data, showByMember, members]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">총 자산 추이</h3>
        {members.length > 1 && (
          <button
            type="button"
            onClick={() => setShowByMember(!showByMember)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              showByMember ? 'accent-soft text-accent' : 'bg-surface-soft text-ink-subtle'
            }`}
          >
            {showByMember ? '합산 보기' : '구성원별 분리'}
          </button>
        )}
      </div>
      <div className="h-72">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 50, left: 80 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: yTickValues[0] ?? 'auto',
            max: yTickValues[yTickValues.length - 1] ?? 'auto',
            stacked: false,
          }}
          curve="monotoneX"
          enablePoints={true}
          pointSize={6}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          enableArea={!showByMember}
          areaOpacity={0.1}
          colors={d => d.color ?? 'var(--accent)'}
          axisBottom={{
            tickRotation: data.length > 8 ? -45 : 0,
            legendOffset: 40,
          }}
          axisLeft={{
            tickValues: yTickValues,
            format: v => {
              const num = Number(v);
              if (Math.abs(num) >= 50_000_000) {
                const eok = num / 100_000_000;
                return Number.isInteger(eok) ? `${eok}억` : `${eok.toFixed(1)}억`;
              }
              if (Math.abs(num) >= 10000) return `${(num / 10000).toFixed(0)}만`;
              return String(v);
            },
          }}
          enableSlices="x"
          sliceTooltip={({ slice }) => (
            <div className="rounded-md bg-surface px-3 py-2 shadow-lg">
              <p className="mb-1 text-xs font-medium text-ink-subtle">
                {slice.points[0].data.xFormatted}
              </p>
              {slice.points.map(point => (
                <div key={point.id} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: point.seriesColor }}
                  />
                  <span className="text-sm text-ink-muted">
                    {point.seriesId}: {formatAmount(point.data.y as number)}
                  </span>
                </div>
              ))}
            </div>
          )}
          theme={nivoTheme}
        />
      </div>
    </Card>
  );
}
