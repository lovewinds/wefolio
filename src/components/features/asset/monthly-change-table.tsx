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
      <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        월별 변동 상세
      </h3>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
              <tr>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-left dark:border-zinc-700">
                  월
                </th>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-right dark:border-zinc-700">
                  총 자산
                </th>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-right dark:border-zinc-700">
                  변동 금액
                </th>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-right dark:border-zinc-700">
                  변동 %
                </th>
                <th className="border-b border-r border-zinc-200 px-3 py-2 text-left dark:border-zinc-700">
                  최대 증가
                </th>
                <th className="border-b border-zinc-200 px-3 py-2 text-left dark:border-zinc-700">
                  최대 감소
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(entry => {
                const deltaColor =
                  entry.deltaAmount === null
                    ? 'text-zinc-400'
                    : entry.deltaAmount > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : entry.deltaAmount < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-zinc-500';

                return (
                  <tr
                    key={`${entry.year}-${entry.month}`}
                    className="border-b border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
                  >
                    <td className="border-r border-zinc-200 px-3 py-2 dark:border-zinc-700">
                      <Link
                        href={`/asset/monthly?year=${entry.year}&month=${entry.month}`}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {entry.year}년 {entry.month}월
                      </Link>
                    </td>
                    <td className="border-r border-zinc-200 px-3 py-2 text-right font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                      {formatAmount(entry.totalValue)}
                    </td>
                    <td
                      className={`border-r border-zinc-200 px-3 py-2 text-right font-medium dark:border-zinc-700 ${deltaColor}`}
                    >
                      {entry.deltaAmount !== null
                        ? `${entry.deltaAmount > 0 ? '+' : ''}${formatAmount(entry.deltaAmount)}`
                        : '-'}
                    </td>
                    <td
                      className={`border-r border-zinc-200 px-3 py-2 text-right dark:border-zinc-700 ${deltaColor}`}
                    >
                      {entry.deltaPercent !== null
                        ? `${entry.deltaPercent > 0 ? '+' : ''}${entry.deltaPercent.toFixed(1)}%`
                        : '-'}
                    </td>
                    <td className="border-r border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
                      {entry.topGainer ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {entry.topGainer.name}{' '}
                          <span className="text-xs">(+{formatAmount(entry.topGainer.amount)})</span>
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {entry.topLoser ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          {entry.topLoser.name}{' '}
                          <span className="text-xs">({formatAmount(entry.topLoser.amount)})</span>
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-zinc-500">
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
