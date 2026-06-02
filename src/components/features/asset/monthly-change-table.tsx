'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import type { AssetTrendEntry } from '@/types';

interface MonthlyChangeTableProps {
  data: AssetTrendEntry[];
}

export function MonthlyChangeTable({ data }: MonthlyChangeTableProps) {
  // Reverse so most recent month is at top
  const sorted = [...data].reverse();

  return (
    <Card className="mt-6">
      <h3 className="mb-4 text-lg font-semibold text-ink">월별 변동 상세</h3>
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="border-b border-r border-hairline px-3 py-2 text-left">월</th>
                <th className="border-b border-r border-hairline px-3 py-2 text-right">총 자산</th>
                <th className="border-b border-r border-hairline px-3 py-2 text-right">
                  변동 금액
                </th>
                <th className="border-b border-r border-hairline px-3 py-2 text-right">변동 %</th>
                <th className="border-b border-r border-hairline px-3 py-2 text-left">최대 증가</th>
                <th className="border-b border-hairline px-3 py-2 text-left">최대 감소</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(entry => {
                const deltaColor =
                  entry.deltaAmount === null
                    ? 'text-ink-subtle'
                    : entry.deltaAmount > 0
                      ? 'text-gain'
                      : entry.deltaAmount < 0
                        ? 'text-loss'
                        : 'text-ink-subtle';

                return (
                  <tr
                    key={`${entry.year}-${entry.month}`}
                    className="border-b border-hairline transition-colors hover:bg-canvas"
                  >
                    <td className="border-r border-hairline px-3 py-2">
                      <Link
                        href={`/asset/monthly?year=${entry.year}&month=${entry.month}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {entry.year}년 {entry.month}월
                      </Link>
                    </td>
                    <td className="border-r border-hairline px-3 py-2 text-right font-semibold text-ink-muted">
                      {formatAmount(entry.totalValue)}
                    </td>
                    <td
                      className={`border-r border-hairline px-3 py-2 text-right font-medium ${deltaColor}`}
                    >
                      {entry.deltaAmount !== null
                        ? `${entry.deltaAmount > 0 ? '+' : ''}${formatAmount(entry.deltaAmount)}`
                        : '-'}
                    </td>
                    <td className={`border-r border-hairline px-3 py-2 text-right ${deltaColor}`}>
                      {entry.deltaPercent !== null
                        ? `${entry.deltaPercent > 0 ? '+' : ''}${entry.deltaPercent.toFixed(1)}%`
                        : '-'}
                    </td>
                    <td className="border-r border-hairline px-3 py-2 text-sm">
                      {entry.topGainer ? (
                        <span className="text-gain">
                          {entry.topGainer.name}{' '}
                          <span className="text-xs">(+{formatAmount(entry.topGainer.amount)})</span>
                        </span>
                      ) : (
                        <span className="text-ink-faint">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {entry.topLoser ? (
                        <span className="text-loss">
                          {entry.topLoser.name}{' '}
                          <span className="text-xs">({formatAmount(entry.topLoser.amount)})</span>
                        </span>
                      ) : (
                        <span className="text-ink-faint">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-ink-subtle">
                    표시할 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
