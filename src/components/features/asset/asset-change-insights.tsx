'use client';

import { ArrowDownRight, ArrowUpRight, CircleDot, LineChart, PiggyBank } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import type { AssetChangeBreakdown } from '@/types';

interface AssetChangeInsightsProps {
  breakdown: AssetChangeBreakdown | null;
  title?: string;
  eyebrow?: string;
  amountFormatter?: (value: number) => string;
  signedAmountFormatter?: (value: number) => string;
}

function defaultSignedAmount(value: number): string {
  if (value === 0) return formatAmount(0);
  return `${value > 0 ? '+' : ''}${formatAmount(value)}`;
}

function toneClass(value: number): string {
  if (value > 0) return 'text-gain';
  if (value < 0) return 'text-loss';
  return 'text-ink-subtle';
}

function barWidth(value: number, maxAbs: number): string {
  if (maxAbs <= 0) return '0%';
  return `${Math.max(8, Math.round((Math.abs(value) / maxAbs) * 100))}%`;
}

export function AssetChangeInsights({
  breakdown,
  title = '총자산',
  eyebrow = '이번 달 자산 변화',
  amountFormatter = formatAmount,
  signedAmountFormatter = defaultSignedAmount,
}: AssetChangeInsightsProps) {
  if (!breakdown) return null;

  const waterfallRows = [
    { label: '외부 순유입(저축·납입)', value: breakdown.delta.externalInflow, icon: PiggyBank },
    { label: '시장 손익', value: breakdown.delta.marketGain, icon: LineChart },
  ];
  const maxAbs = Math.max(...waterfallRows.map(row => Math.abs(row.value)), 1);
  const holdingChanges = breakdown.holdingChanges;
  const hasHoldingChanges =
    holdingChanges.newCount > 0 ||
    holdingChanges.increasedCount > 0 ||
    holdingChanges.decreasedCount > 0 ||
    holdingChanges.closedCount > 0;

  return (
    <Card className="mb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink-subtle">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold text-ink">
            {title} {signedAmountFormatter(breakdown.delta.totalValue)}
          </h2>
        </div>
        <div className="rounded-lg bg-surface-soft px-3 py-2 text-right">
          <p className="text-xs text-ink-subtle">현재 총자산</p>
          <p className="text-sm font-semibold text-ink">
            {amountFormatter(breakdown.current.totalValue)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {waterfallRows.map(row => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)_120px] sm:items-center"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-ink-muted">
                <Icon size={16} />
                {row.label}
              </div>
              <div className="h-3 rounded-full bg-surface-soft">
                <div
                  className={`h-3 rounded-full ${row.value >= 0 ? 'bg-gain' : 'bg-loss'}`}
                  style={{ width: barWidth(row.value, maxAbs) }}
                />
              </div>
              <p className={`text-right text-sm font-semibold ${toneClass(row.value)}`}>
                {signedAmountFormatter(row.value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 border-t border-hairline pt-4 md:grid-cols-2">
        <div className="rounded-lg bg-surface-soft p-4">
          <p className="text-xs font-medium text-ink-subtle">계좌 기준 원천 변화</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">현금 잔고 변화</span>
              <span className={`text-sm font-semibold ${toneClass(breakdown.delta.cashValue)}`}>
                {signedAmountFormatter(breakdown.delta.cashValue)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">투자 평가액 변화</span>
              <span
                className={`text-sm font-semibold ${toneClass(breakdown.delta.investmentValue)}`}
              >
                {signedAmountFormatter(breakdown.delta.investmentValue)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-subtle">
            외부 순유입 = 현금 잔고 변화 + 투자로 들어간 순매매, 시장 손익 = 보유 자산의 가격 변동.
            거래 기록이 없어 월말가 기준 추정입니다.
          </p>
        </div>

        <div className="rounded-lg bg-surface-soft p-4">
          {breakdown.movementInsight ? (
            <>
              <div className="flex items-center gap-2">
                {breakdown.movementInsight.type === 'investment_to_cash' ? (
                  <ArrowDownRight size={16} className="text-ink-muted" />
                ) : breakdown.movementInsight.type === 'cash_to_investment' ? (
                  <ArrowUpRight size={16} className="text-ink-muted" />
                ) : (
                  <CircleDot size={16} className="text-ink-muted" />
                )}
                <p className="text-sm font-semibold text-ink">{breakdown.movementInsight.title}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {breakdown.movementInsight.description}
              </p>
              {breakdown.movementInsight.confidence === 'estimated' && (
                <p className="mt-2 text-xs text-ink-subtle">
                  거래 기록이 없으므로 월말 스냅샷 기반 추정입니다.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-muted">이번 달 감지된 이동 패턴이 없습니다.</p>
          )}

          {hasHoldingChanges && (
            <div className="mt-4 flex flex-wrap gap-2">
              {holdingChanges.newCount > 0 && (
                <ChangePill label="신규" value={holdingChanges.newCount} />
              )}
              {holdingChanges.increasedCount > 0 && (
                <ChangePill label="수량 증가" value={holdingChanges.increasedCount} />
              )}
              {holdingChanges.decreasedCount > 0 && (
                <ChangePill label="수량 감소" value={holdingChanges.decreasedCount} />
              )}
              {holdingChanges.closedCount > 0 && (
                <ChangePill label="정리" value={holdingChanges.closedCount} />
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ChangePill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted">
      {label} {value}
    </span>
  );
}
