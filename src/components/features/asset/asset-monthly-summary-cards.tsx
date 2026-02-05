'use client';

import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import { RISK_LEVEL_COLORS } from '@/lib/constants';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RiskGroupDelta } from '@/types';

interface AssetMonthlySummaryCardsProps {
  totalValue: number;
  prevTotalValue: number | null;
  deltaAmount: number | null;
  deltaPercent: number | null;
  byRiskLevel: { riskLevel: string; percentage: number }[];
  prevByRiskLevel: RiskGroupDelta[];
}

function DeltaDisplay({ amount, percent }: { amount: number | null; percent: number | null }) {
  if (amount === null || percent === null) {
    return <span className="text-sm text-zinc-400 dark:text-zinc-500">전월 데이터 없음</span>;
  }

  const isPositive = amount > 0;
  const isZero = amount === 0;

  const colorClass = isZero
    ? 'text-zinc-500'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-600 dark:text-rose-400';

  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;
  const sign = isPositive ? '+' : '';

  return (
    <div className={`flex items-center gap-1.5 ${colorClass}`}>
      <Icon size={16} strokeWidth={2} />
      <span className="text-sm font-semibold">
        {sign}
        {formatAmount(amount)}
      </span>
      <span className="text-xs">
        ({sign}
        {percent.toFixed(1)}%)
      </span>
    </div>
  );
}

export function AssetMonthlySummaryCards({
  totalValue,
  prevTotalValue,
  deltaAmount,
  deltaPercent,
  byRiskLevel,
  prevByRiskLevel,
}: AssetMonthlySummaryCardsProps) {
  const riskLevels = ['안전자산', '중립자산', '위험자산'];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Asset Card */}
      <Card className="col-span-1 sm:col-span-2 lg:col-span-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">총 자산</p>
        <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatAmount(totalValue)}
        </p>
        <div className="mt-2">
          <DeltaDisplay amount={deltaAmount} percent={deltaPercent} />
        </div>
        {prevTotalValue !== null && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            전월 {formatAmount(prevTotalValue)}
          </p>
        )}
      </Card>

      {/* Risk Level Cards */}
      {riskLevels.map(riskLevel => {
        const current = byRiskLevel.find(g => g.riskLevel === riskLevel);
        const prev = prevByRiskLevel.find(g => g.riskLevel === riskLevel);
        const currentPct = current?.percentage ?? 0;
        const prevPct = prev?.percentage ?? null;
        const pctDelta = prevPct !== null ? currentPct - prevPct : null;

        return (
          <Card key={riskLevel}>
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: RISK_LEVEL_COLORS[riskLevel] ?? '#6b7280' }}
              />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{riskLevel}</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {currentPct.toFixed(1)}%
            </p>
            {pctDelta !== null && (
              <p
                className={`mt-1 text-xs ${
                  pctDelta === 0
                    ? 'text-zinc-400'
                    : pctDelta > 0
                      ? 'text-zinc-500'
                      : 'text-zinc-500'
                }`}
              >
                전월 대비 {pctDelta > 0 ? '+' : ''}
                {pctDelta.toFixed(1)}%p
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
