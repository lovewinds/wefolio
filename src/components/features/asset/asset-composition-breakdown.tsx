'use client';

import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import type { HoldingRow, HoldingRowWithDelta } from '@/types';

interface AssetCompositionBreakdownProps {
  holdings: (HoldingRow | HoldingRowWithDelta)[];
  totalValue: number;
}

type GroupKey = 'memberName' | 'institutionName' | 'assetClass';

const GROUPS: { key: GroupKey; title: string }[] = [
  { key: 'memberName', title: '구성원별' },
  { key: 'institutionName', title: '기관별' },
  { key: 'assetClass', title: '자산군별' },
];

export function AssetCompositionBreakdown({
  holdings,
  totalValue,
}: AssetCompositionBreakdownProps) {
  return (
    <Card className="mb-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-ink-subtle">구성별 분해</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">이번 달 자산 구성을 나눠 봅니다</h3>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {GROUPS.map(group => (
          <CompositionGroup
            key={group.key}
            title={group.title}
            rows={buildRows(holdings, group.key, totalValue)}
          />
        ))}
      </div>
    </Card>
  );
}

function buildRows(
  holdings: (HoldingRow | HoldingRowWithDelta)[],
  key: GroupKey,
  totalValue: number
) {
  const grouped = new Map<string, number>();

  for (const holding of holdings) {
    const label = holding[key];
    grouped.set(label, (grouped.get(label) ?? 0) + holding.totalValueKRW);
  }

  return Array.from(grouped.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function CompositionGroup({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; percentage: number }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <div className="mt-3 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-ink-subtle">데이터 없음</p>
        ) : (
          rows.map(row => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-ink-muted">{row.label}</span>
                <span className="shrink-0 text-xs text-ink-subtle">
                  {row.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-soft">
                <div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: `${Math.max(4, row.percentage)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-subtle">{formatAmount(row.value)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
