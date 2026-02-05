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
      <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
              <tr>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-left dark:border-zinc-700">
                  자산명
                </th>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-left dark:border-zinc-700">
                  자산유형
                </th>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-left dark:border-zinc-700">
                  기관
                </th>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-left dark:border-zinc-700">
                  소유자
                </th>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-right dark:border-zinc-700">
                  평가금액
                </th>
                <th className="border-b border-zinc-200 px-3 py-2 text-right dark:border-zinc-700">
                  비율
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-zinc-500">
                    해당 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                sorted.map(h => (
                  <tr
                    key={h.id}
                    className="border-b border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
                  >
                    <td className="border-r border-zinc-200 px-3 py-2 font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                      {h.assetName}
                    </td>
                    <td className="border-r border-zinc-200 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                      {h.subClass ? `${h.assetClass} > ${h.subClass}` : h.assetClass}
                    </td>
                    <td className="border-r border-zinc-200 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                      {h.institutionName}
                    </td>
                    <td className="border-r border-zinc-200 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                      {h.memberName}
                    </td>
                    <td className="border-r border-zinc-200 px-3 py-2 text-right font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                      {formatAmount(h.totalValueKRW)}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-200">
                      {totalValue > 0 ? ((h.totalValueKRW / totalValue) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {sorted.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-200 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <span>
              종목 수{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                {sorted.length}
              </span>
              개
            </span>
            <span>
              합계{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                {formatAmount(sorted.reduce((sum, h) => sum + h.totalValueKRW, 0))}
              </span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
