'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatAmount } from '@/lib/format-utils';
import { Card, EmptyState, PageContainer } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';
import { AssetChangeInsights } from './asset-change-insights';
import { AssetPageToolbar } from './asset-page-toolbar';
import type { AssetMonthlyDataWithDelta } from '@/types';

interface AssetOverviewViewProps {
  initialData: AssetMonthlyDataWithDelta;
  initialYear: number;
  initialMonth: number;
}

function signedAmount(value: number | null): string {
  if (value === null) return '전월 데이터 없음';
  if (value === 0) return formatAmount(0);
  return `${value > 0 ? '+' : ''}${formatAmount(value)}`;
}

function toneClass(value: number | null): string {
  if (value === null || value === 0) return 'text-ink-subtle';
  return value > 0 ? 'text-gain' : 'text-loss';
}

export function AssetOverviewView({
  initialData,
  initialYear,
  initialMonth,
}: AssetOverviewViewProps) {
  const [data, setData] = useState<AssetMonthlyDataWithDelta>(initialData);
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
      const result = await apiClient.asset.getMonthlyWithDelta<AssetMonthlyDataWithDelta>(
        selectedYear,
        selectedMonth
      );
      setData(result);
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
          <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <Card className="overflow-hidden">
              <div className="flex min-h-72 flex-col justify-between gap-8">
                <div>
                  <p className="text-sm font-semibold text-ink-subtle">
                    우리 집 순자산 · {selectedYear}년 {selectedMonth}월
                  </p>
                  <p className="mt-3 text-4xl font-bold text-ink md:text-5xl">
                    {formatAmount(data.totalValue)}
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
                <div className="grid gap-3 md:grid-cols-3">
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
                    delta={delta?.unrealizedGain ?? null}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-ink-subtle">이번 달 증가 분해</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">
                {signedAmount(delta?.totalValue ?? null)}
              </h2>
              <div className="mt-5 space-y-4">
                <BreakdownRow label="현금 잔고 변화" value={delta?.cashValue ?? null} />
                <BreakdownRow label="투자 평가액 변화" value={delta?.investmentValue ?? null} />
                <BreakdownRow label="보유원금 변화" value={delta?.principalValue ?? null} subtle />
                <BreakdownRow
                  label="미실현손익 변화"
                  value={delta?.unrealizedGain ?? null}
                  subtle
                />
              </div>
              <p className="mt-5 text-xs leading-relaxed text-ink-subtle">
                거래 기록 없이 확정할 수 없는 저축액·실현손익은 단정하지 않고, 월말 스냅샷의 현금과
                투자 평가액 변화만 나누어 보여줍니다.
              </p>
            </Card>
          </div>

          <AssetChangeInsights
            breakdown={data.changeBreakdown}
            title="자산 증가 분해"
            eyebrow="워터폴"
          />
        </>
      )}
    </PageContainer>
  );
}

interface OverviewKpiProps {
  icon: typeof BarChart3;
  label: string;
  value: number;
  delta: number | null;
}

function OverviewKpi({ icon: Icon, label, value, delta }: OverviewKpiProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-soft p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-subtle">
        <Icon size={16} />
        {label}
      </div>
      <p className="mt-2 text-xl font-bold text-ink">{formatAmount(value)}</p>
      <p className={`mt-1 text-xs font-medium ${toneClass(delta)}`}>{signedAmount(delta)}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value: number | null;
  subtle?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={subtle ? 'text-sm text-ink-subtle' : 'text-sm font-medium text-ink-muted'}>
        {label}
      </span>
      <span className={`text-sm font-semibold ${toneClass(value)}`}>{signedAmount(value)}</span>
    </div>
  );
}
