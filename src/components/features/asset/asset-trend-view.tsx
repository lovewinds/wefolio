'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { PeriodSelector } from '@/components/features/navigation';
import { AssetPageToolbar } from './asset-page-toolbar';
import { AssetTotalTrendChart } from './asset-total-trend-chart';
import { AssetRiskTrendChart } from './asset-risk-trend-chart';
import { MonthlyChangeTable } from './monthly-change-table';
import { PageContainer, EmptyState } from '@/components/ui';
import type { AssetTrendData, AssetTrendEntry } from '@/types';
import { useMonthNavigation } from '@/hooks';
import { computeAssetTrendRange } from './asset-trend-range';

interface AssetTrendViewProps {
  initialData: AssetTrendData;
  initialEndDate: { year: number; month: number };
  availableRange: {
    min: { year: number; month: number };
    max: { year: number; month: number };
  } | null;
}

export function AssetTrendView({
  initialData,
  initialEndDate,
  availableRange,
}: AssetTrendViewProps) {
  const [periodMonths, setPeriodMonths] = useState(6);
  const [data, setData] = useState<AssetTrendEntry[]>(initialData.trend);
  const [isFetching, setIsFetching] = useState(false);

  const {
    selectedYear,
    selectedMonth,
    setSelectedDate,
    canMovePrev,
    canMoveNext,
    updateRangeFromData,
  } = useMonthNavigation({
    initialDate: initialEndDate,
    allowFutureNavigation: false,
  });

  const fetchTrend = useCallback(
    async (months: number, endDate = { year: selectedYear, month: selectedMonth }) => {
      const range = computeAssetTrendRange(months, endDate, availableRange);
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
    [availableRange, selectedMonth, selectedYear]
  );

  const handlePeriodChange = (months: number) => {
    setPeriodMonths(months);
    fetchTrend(months);
  };

  const handleDateChange = (date: { year: number; month: number }) => {
    setSelectedDate(date);
    fetchTrend(periodMonths, date);
  };

  useEffect(() => {
    updateRangeFromData(availableRange);
  }, [availableRange, updateRangeFromData]);

  // Filter out months with no data
  const filteredData = useMemo(() => {
    return data.filter(entry => entry.totalValue > 0);
  }, [data]);

  const isEmpty = filteredData.length === 0;

  return (
    <PageContainer isFetching={isFetching}>
      <AssetPageToolbar
        year={selectedYear}
        month={selectedMonth}
        titleSuffix="자산 추이"
        canPrev={canMovePrev}
        canNext={canMoveNext}
        onPrevMonth={() => {
          const month = selectedMonth === 1 ? 12 : selectedMonth - 1;
          const year = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
          handleDateChange({ year, month });
        }}
        onNextMonth={() => {
          const month = selectedMonth === 12 ? 1 : selectedMonth + 1;
          const year = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
          handleDateChange({ year, month });
        }}
        onYearChange={year => handleDateChange({ year, month: selectedMonth })}
        onMonthChange={month => handleDateChange({ year: selectedYear, month })}
      />

      <section className="mb-6 flex justify-end">
        <PeriodSelector selectedMonths={periodMonths} onSelect={handlePeriodChange} />
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
