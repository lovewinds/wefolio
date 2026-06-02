'use client';

import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import type { HoldingRow } from '@/types';

interface PortfolioDetailPanelProps {
  holdings: HoldingRow[];
  totalValue: number;
  title: string;
}

export function PortfolioDetailPanel({ holdings, totalValue, title }: PortfolioDetailPanelProps) {
  const sorted = [...holdings].sort((a, b) => b.totalValueKRW - a.totalValueKRW);

  return (
    <Card className="mt-6">
      <h3 className="mb-4 text-lg font-semibold text-ink">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="border-b border-r border-hairline px-3 py-2 text-left">자산명</th>
                <th className="border-b border-r border-hairline px-3 py-2 text-left">자산유형</th>
                <th className="border-b border-r border-hairline px-3 py-2 text-left">기관</th>
                <th className="border-b border-r border-hairline px-3 py-2 text-left">소유자</th>
                <th className="border-b border-r border-hairline px-3 py-2 text-right">평가금액</th>
                <th className="border-b border-hairline px-3 py-2 text-right">비율</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-ink-subtle">
                    해당 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                sorted.map(h => (
                  <tr
                    key={h.id}
                    className="border-b border-hairline transition-colors hover:bg-canvas"
                  >
                    <td className="border-r border-hairline px-3 py-2 font-medium text-ink-muted">
                      {h.assetName}
                    </td>
                    <td className="border-r border-hairline px-3 py-2 text-ink-muted">
                      {h.subClass ? `${h.assetClass} > ${h.subClass}` : h.assetClass}
                    </td>
                    <td className="border-r border-hairline px-3 py-2 text-ink-muted">
                      {h.institutionName}
                    </td>
                    <td className="border-r border-hairline px-3 py-2 text-ink-muted">
                      {h.memberName}
                    </td>
                    <td className="border-r border-hairline px-3 py-2 text-right font-semibold text-ink-muted">
                      {formatAmount(h.totalValueKRW)}
                    </td>
                    <td className="px-3 py-2 text-right text-ink-muted">
                      {totalValue > 0 ? ((h.totalValueKRW / totalValue) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {sorted.length > 0 && (
          <div className="flex items-center justify-between border-t border-hairline bg-surface-soft px-4 py-3 text-xs text-ink-muted">
            <span>
              종목 수 <span className="font-semibold text-ink">{sorted.length}</span>개
            </span>
            <span>
              합계{' '}
              <span className="font-semibold text-ink">
                {formatAmount(sorted.reduce((sum, h) => sum + h.totalValueKRW, 0))}
              </span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
