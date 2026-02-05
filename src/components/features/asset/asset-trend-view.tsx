'use client';

import { useCallback, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { PeriodSelector } from '@/components/features/navigation';
import { AssetTotalTrendChart } from './asset-total-trend-chart';
import { AssetRiskTrendChart } from './asset-risk-trend-chart';
import { MonthlyChangeTable } from './monthly-change-table';
import { PageContainer, EmptyState } from '@/components/ui';
import type { AssetTrendData, AssetTrendEntry } from '@/types';

interface AssetTrendViewProps {
  initialData: AssetTrendData;
  availableRange: {
    min: { year: number; month: number };
    max: { year: number; month: number };
  } | null;
}

function computeDateRange(
  periodMonths: number,
  availableRange: {
    min: { year: number; month: number };
    max: { year: number; month: number };
  } | null
) {
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;

  if (periodMonths === 0 && availableRange) {
    return {
      startYear: availableRange.min.year,
      startMonth: availableRange.min.month,
      endYear,
      endMonth,
    };
  }

  let startYear = endYear;
  let startMonth = endMonth - (periodMonths - 1);
  while (startMonth < 1) {
    startMonth += 12;
    startYear--;
  }

  return { startYear, startMonth, endYear, endMonth };
}

export function AssetTrendView({ initialData, availableRange }: AssetTrendViewProps) {
  const [periodMonths, setPeriodMonths] = useState(6);
  const [data, setData] = useState<AssetTrendEntry[]>(initialData.trend);
  const [isFetching, setIsFetching] = useState(false);

  const fetchTrend = useCallback(
    async (months: number) => {
      const range = computeDateRange(months, availableRange);
      try {
        setIsFetching(true);
        const result = await apiClient.asset.getTrend<AssetTrendData>(
          range.startYear,
          range.startMonth,
          range.endYear,
          range.endMonth
        );
        setData(result.trend);
      } catch {
        // Keep previous data
      } finally {
        setIsFetching(false);
      }
    },
    [availableRange]
  );

  const handlePeriodChange = (months: number) => {
    setPeriodMonths(months);
    fetchTrend(months);
  };

  // Filter out months with no data
  const filteredData = useMemo(() => {
    return data.filter(entry => entry.totalValue > 0);
  }, [data]);

  const isEmpty = filteredData.length === 0;

  return (
    <PageContainer isFetching={isFetching}>
      <section className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">자산 추이</h2>
          <PeriodSelector selectedMonths={periodMonths} onSelect={handlePeriodChange} />
        </div>
      </section>

      {isEmpty ? (
        <EmptyState
          title="자산 추이 데이터가 없습니다."
          description="자산 스냅샷 데이터를 추가하면 추이를 확인할 수 있습니다."
        />
      ) : (
        <>
          <AssetTotalTrendChart data={filteredData} />
          <AssetRiskTrendChart data={filteredData} />
          <MonthlyChangeTable data={filteredData} />
        </>
      )}
    </PageContainer>
  );
}
