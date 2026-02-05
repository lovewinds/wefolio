'use client';

import { useMemo, useState } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
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

  const chartData = useMemo(() => {
    if (!showByMember || members.length === 0) {
      return [
        {
          id: '총 자산',
          color: '#3b82f6',
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
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">총 자산 추이</h3>
        {members.length > 1 && (
          <button
            type="button"
            onClick={() => setShowByMember(!showByMember)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              showByMember
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
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
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
          curve="monotoneX"
          enablePoints={true}
          pointSize={6}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          enableArea={!showByMember}
          areaOpacity={0.1}
          colors={d => d.color ?? '#3b82f6'}
          axisBottom={{
            tickRotation: data.length > 8 ? -45 : 0,
            legendOffset: 40,
          }}
          axisLeft={{
            format: v => {
              const num = Number(v);
              if (num >= 100000000) return `${(num / 100000000).toFixed(0)}억`;
              if (num >= 10000) return `${(num / 10000).toFixed(0)}만`;
              return String(v);
            },
          }}
          enableSlices="x"
          sliceTooltip={({ slice }) => (
            <div className="rounded-md bg-white px-3 py-2 shadow-lg dark:bg-zinc-800">
              <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {slice.points[0].data.xFormatted}
              </p>
              {slice.points.map(point => (
                <div key={point.id} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: point.seriesColor }}
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">
                    {point.seriesId}: {formatAmount(point.data.y as number)}
                  </span>
                </div>
              ))}
            </div>
          )}
          theme={{
            axis: {
              ticks: {
                text: { fill: '#71717a', fontSize: 11 },
              },
            },
            grid: {
              line: { stroke: '#e4e4e7', strokeWidth: 1 },
            },
          }}
        />
      </div>
    </Card>
  );
}
