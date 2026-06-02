'use client';

import { useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import { nivoTheme } from '@/lib/chart-theme';
import { RISK_LEVEL_COLORS } from '@/lib/constants';
import type { AssetTrendEntry } from '@/types';

interface AssetRiskTrendChartProps {
  data: AssetTrendEntry[];
}

const RISK_LEVELS = ['안전자산', '중립자산', '위험자산'];

export function AssetRiskTrendChart({ data }: AssetRiskTrendChartProps) {
  const [showPercent, setShowPercent] = useState(false);

  const barData = useMemo(() => {
    return data.map(entry => {
      const row: Record<string, string | number> = {
        month: `${entry.year}.${String(entry.month).padStart(2, '0')}`,
      };
      for (const rl of RISK_LEVELS) {
        const group = entry.byRiskLevel.find(g => g.riskLevel === rl);
        if (showPercent) {
          row[rl] = group?.percentage ?? 0;
        } else {
          row[rl] = group?.totalValue ?? 0;
        }
      }
      return row;
    });
  }, [data, showPercent]);

  return (
    <Card className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">위험등급별 추이</h3>
        <button
          type="button"
          onClick={() => setShowPercent(!showPercent)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            showPercent ? 'accent-soft text-accent' : 'bg-surface-soft text-ink-subtle'
          }`}
        >
          {showPercent ? '금액 보기' : '비율 보기'}
        </button>
      </div>
      <div className="h-72">
        <ResponsiveBar
          data={barData}
          keys={RISK_LEVELS}
          indexBy="month"
          margin={{ top: 20, right: 20, bottom: 50, left: 80 }}
          padding={0.3}
          groupMode="stacked"
          colors={d => RISK_LEVEL_COLORS[d.id as string] ?? '#6b7280'}
          axisBottom={{
            tickRotation: data.length > 8 ? -45 : 0,
          }}
          axisLeft={{
            format: v => {
              if (showPercent) return `${v}%`;
              const num = Number(v);
              if (num >= 100000000) return `${(num / 100000000).toFixed(0)}억`;
              if (num >= 10000) return `${(num / 10000).toFixed(0)}만`;
              return String(v);
            },
          }}
          labelSkipWidth={20}
          labelSkipHeight={20}
          enableLabel={false}
          tooltip={({ id, value, indexValue }) => (
            <div className="rounded-md bg-surface px-3 py-2 shadow-lg">
              <p className="text-xs text-ink-subtle">{indexValue}</p>
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: RISK_LEVEL_COLORS[id as string] ?? '#6b7280' }}
                />
                <span className="text-sm font-medium text-ink-muted">
                  {id}: {showPercent ? `${Number(value).toFixed(1)}%` : formatAmount(Number(value))}
                </span>
              </div>
            </div>
          )}
          theme={nivoTheme}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {RISK_LEVELS.map(level => (
          <div key={level} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: RISK_LEVEL_COLORS[level] ?? '#6b7280' }}
            />
            <span className="text-xs text-ink-muted">{level}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
