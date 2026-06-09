'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Coins,
  LineChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatKoreanWonCompact } from '@/lib/format-utils';
import { Card, EmptyState, PageContainer } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';
import { AssetChangeInsights } from './asset-change-insights';
import { AssetPageToolbar } from './asset-page-toolbar';
import { computeAssetTrendRange } from './asset-trend-range';
import type { AssetMonthlyDataWithDelta, AssetTrendData, AssetTrendEntry } from '@/types';

const SPARKLINE_MONTHS = 7;

interface AssetOverviewViewProps {
  initialData: AssetMonthlyDataWithDelta;
  initialSparkline: AssetTrendEntry[];
  initialYear: number;
  initialMonth: number;
}

function signedAmount(value: number | null): string {
  if (value === null) return '전월 데이터 없음';
  return formatKoreanWonCompact(value, { signed: true });
}

function toneClass(value: number | null): string {
  if (value === null || value === 0) return 'text-ink-subtle';
  return value > 0 ? 'text-gain' : 'text-loss';
}

export function AssetOverviewView({
  initialData,
  initialSparkline,
  initialYear,
  initialMonth,
}: AssetOverviewViewProps) {
  const [data, setData] = useState<AssetMonthlyDataWithDelta>(initialData);
  const [sparkline, setSparkline] = useState<AssetTrendEntry[]>(initialSparkline);
  const [isFetching, setIsFetching] = useState(false);

  const {
    selectedYear,
    selectedMonth,
    handlePrevMonth,
    handleNextMonth,
    setSelectedDate,
    canMovePrev,
    canMoveNext,
    updateRangeFromData,
  } = useMonthNavigation({
    initialDate: { year: initialYear, month: initialMonth },
    allowFutureNavigation: true,
  });

  const loadOverviewData = useCallback(async () => {
    try {
      setIsFetching(true);
      const range = computeAssetTrendRange(
        SPARKLINE_MONTHS,
        { year: selectedYear, month: selectedMonth },
        null
      );
      const [result, trendResult] = await Promise.all([
        apiClient.asset.getMonthlyWithDelta<AssetMonthlyDataWithDelta>(selectedYear, selectedMonth),
        apiClient.asset.getTrend<AssetTrendData>(
          range.startYear,
          range.startMonth,
          range.endYear,
          range.endMonth
        ),
      ]);
      setData(result);
      setSparkline(trendResult.trend);
    } catch {
      // Keep previous data on error.
    } finally {
      setIsFetching(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedYear === initialYear && selectedMonth === initialMonth) return;
    loadOverviewData();
  }, [selectedYear, selectedMonth, initialYear, initialMonth, loadOverviewData]);

  useEffect(() => {
    updateRangeFromData(data.availableRange);
  }, [data.availableRange, updateRangeFromData]);

  const isEmpty = data.totalValue === 0 && data.metrics.cashValue === 0;
  const delta = data.changeBreakdown?.delta ?? null;
  const cashAndPrincipalDelta = delta !== null ? delta.cashValue + delta.principalValue : null;

  return (
    <PageContainer isFetching={isFetching}>
      <AssetPageToolbar
        year={selectedYear}
        month={selectedMonth}
        titleSuffix="자산 개요"
        canPrev={canMovePrev}
        canNext={canMoveNext}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onYearChange={year => setSelectedDate({ year, month: selectedMonth })}
        onMonthChange={month => setSelectedDate({ year: selectedYear, month })}
      />

      {isEmpty ? (
        <EmptyState
          title={`${selectedYear}년 ${selectedMonth}월 자산 데이터가 없습니다.`}
          description="월별 현황에서 이번 달 자산을 입력하면 개요가 표시됩니다."
        />
      ) : (
        <>
          <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
            <div
              className="overflow-hidden rounded-xl border border-hairline p-6 shadow-[var(--shadow-1)]"
              style={{ backgroundColor: 'var(--block-cream)' }}
            >
              <div className="flex h-full flex-col gap-6">
                <div>
                  <p className="text-sm font-semibold text-ink-subtle">
                    우리 집 순자산 · {selectedYear}년 {selectedMonth}월
                  </p>
                  <p className="mt-3 text-4xl font-bold text-ink md:text-5xl">
                    {formatKoreanWonCompact(data.totalValue)}
                  </p>
                  <div className={`mt-3 flex items-center gap-2 ${toneClass(data.deltaAmount)}`}>
                    {data.deltaAmount !== null &&
                      (data.deltaAmount >= 0 ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      ))}
                    <span className="text-sm font-semibold">
                      지난달보다 {signedAmount(data.deltaAmount)}
                    </span>
                    {data.deltaPercent !== null && (
                      <span className="text-xs">({data.deltaPercent.toFixed(1)}%)</span>
                    )}
                  </div>
                </div>
                <div className="mt-auto">
                  <HeroSparkline series={sparkline} year={selectedYear} month={selectedMonth} />
                </div>
              </div>
            </div>

            <Card>
              <div className="flex h-full flex-col">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-subtle">이번 달 증가 분석</p>
                    <p className="mt-1 text-xs text-ink-subtle">
                      {data.changeBreakdown ? '전월 대비 변화' : '기준월'}
                    </p>
                  </div>
                  <span className="rounded-full border border-hairline bg-surface-soft px-2.5 py-1 text-xs font-semibold text-accent">
                    핵심
                  </span>
                </div>
                {delta ? (
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DriverCard
                        tone="gain"
                        icon={Coins}
                        label="현금·원금 변화"
                        value={cashAndPrincipalDelta}
                        detail={`현금 ${signedAmount(delta.cashValue)} · 원금 ${signedAmount(delta.principalValue)}`}
                      />
                      <DriverCard
                        tone="accent"
                        icon={LineChart}
                        label="평가손익 변화"
                        value={delta.unrealizedGain}
                        detail="현재 보유 자산의 미실현손익 변화"
                      />
                    </div>
                    <div className="mt-auto">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-subtle">
                        <span className="min-w-0">
                          총자산 변화 {signedAmount(delta.totalValue)}
                        </span>
                        <span className="min-w-0">
                          원금 {formatDriverShare(cashAndPrincipalDelta, delta.unrealizedGain)} ·
                          손익 {formatDriverShare(delta.unrealizedGain, cashAndPrincipalDelta)}
                        </span>
                      </div>
                      <DriverGauge
                        principal={cashAndPrincipalDelta ?? 0}
                        gain={delta.unrealizedGain}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-ink-subtle">기준월에는 직전 비교 데이터가 없습니다.</p>
                )}
                <p className="mt-4 text-xs text-ink-subtle">
                  월말 스냅샷 기준 · 현금·원금과 평가손익 변화만 구분합니다.
                </p>
              </div>
            </Card>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <OverviewKpi
              icon={BarChart3}
              label="투자 평가액"
              value={data.metrics.investmentValue}
              delta={delta?.investmentValue ?? null}
            />
            <OverviewKpi
              icon={Wallet}
              label="현금 잔고"
              value={data.metrics.cashValue}
              delta={delta?.cashValue ?? null}
            />
            <OverviewKpi
              icon={Sparkles}
              label="평가손익"
              value={data.metrics.unrealizedGain}
              signed
              subline={`원금 ${formatKoreanWonCompact(data.metrics.principalValue)}`}
            />
          </div>

          <AssetChangeInsights
            breakdown={data.changeBreakdown}
            title="자산 증가 분해"
            eyebrow="워터폴"
            amountFormatter={formatKoreanWonCompact}
            signedAmountFormatter={value => formatKoreanWonCompact(value, { signed: true })}
          />
        </>
      )}
    </PageContainer>
  );
}

interface OverviewKpiProps {
  icon: LucideIcon;
  label: string;
  value: number;
  signed?: boolean;
  delta?: number | null;
  subline?: string;
}

function OverviewKpi({
  icon: Icon,
  label,
  value,
  signed = false,
  delta = null,
  subline,
}: OverviewKpiProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-subtle">
        <Icon size={16} />
        {label}
      </div>
      <p className={`mt-3 text-2xl font-bold ${signed ? toneClass(value) : 'text-ink'}`}>
        {formatKoreanWonCompact(value, { signed })}
      </p>
      {subline ? (
        <p className="mt-1 text-xs font-medium text-ink-subtle">{subline}</p>
      ) : (
        <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${toneClass(delta)}`}>
          {delta !== null &&
            delta !== 0 &&
            (delta > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}
          {signedAmount(delta)}
        </p>
      )}
    </Card>
  );
}

function HeroSparkline({
  series,
  year,
  month,
}: {
  series: AssetTrendEntry[];
  year: number;
  month: number;
}) {
  const points = series.filter(s => s.totalValue > 0);
  if (points.length < 2) return null;

  const barMax = 72;
  const maxN = Math.max(...points.map(s => s.totalValue)) || 1;

  return (
    <div>
      <div className="flex h-[72px] items-end gap-1.5">
        {points.map(s => {
          const isCurrent = s.year === year && s.month === month;
          const investHeight = (s.metrics.investmentValue / maxN) * barMax;
          const cashHeight = (s.metrics.cashValue / maxN) * barMax;
          return (
            <div
              key={`${s.year}-${s.month}`}
              title={`${s.year}.${String(s.month).padStart(2, '0')}`}
              className={`flex flex-1 flex-col overflow-hidden rounded-md ${isCurrent ? '' : 'opacity-45'}`}
            >
              <div className="bg-accent" style={{ height: `${investHeight}px` }} />
              <div className="bg-accent/30" style={{ height: `${cashHeight}px` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-ink-subtle">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-accent" />
          투자 평가액
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-accent/30" />
          현금
        </span>
      </div>
    </div>
  );
}

function DriverCard({
  tone,
  icon: Icon,
  label,
  value,
  detail,
}: {
  tone: 'gain' | 'accent';
  icon: LucideIcon;
  label: string;
  value: number | null;
  detail: string;
}) {
  const toneClasses = tone === 'gain' ? 'bg-gain/10' : 'bg-accent/10';
  const iconClass = tone === 'gain' ? 'bg-gain' : 'bg-accent';

  return (
    <div className={`min-w-0 rounded-lg border border-hairline p-4 ${toneClasses}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="mt-4 text-sm font-medium text-ink-muted">{label}</p>
      <p className={`mt-2 break-keep text-2xl font-bold ${toneClass(value)}`}>
        {signedAmount(value)}
      </p>
      <p className="mt-2 break-keep text-xs leading-relaxed text-ink-subtle">{detail}</p>
    </div>
  );
}

function DriverGauge({ principal, gain }: { principal: number; gain: number }) {
  const principalPositive = Math.max(principal, 0);
  const gainPositive = Math.max(gain, 0);
  const total = principalPositive + gainPositive || 1;
  const principalPct = (principalPositive / total) * 100;
  const gainPct = (gainPositive / total) * 100;

  return (
    <div className="flex h-7 overflow-hidden rounded-full bg-surface-soft text-xs font-semibold text-white">
      <div
        className="flex items-center justify-center bg-gain"
        style={{ width: `${principalPct}%` }}
      >
        {principalPct > 14 ? '원금' : ''}
      </div>
      <div className="flex items-center justify-center bg-accent" style={{ width: `${gainPct}%` }}>
        {gainPct > 14 ? '손익' : ''}
      </div>
    </div>
  );
}

function formatDriverShare(value: number | null, otherValue: number | null): string {
  const positive = Math.max(value ?? 0, 0);
  const otherPositive = Math.max(otherValue ?? 0, 0);
  const total = positive + otherPositive;
  if (total === 0) return '0%';
  return `${Math.round((positive / total) * 100)}%`;
}
