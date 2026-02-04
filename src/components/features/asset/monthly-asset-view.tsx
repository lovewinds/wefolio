'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { MonthSelector } from '@/components/features/navigation';
import { AssetRiskPieChart, AssetHoldingTable } from '@/components/features/asset';
import { PageContainer, EmptyState } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';
import type { AssetMonthlyData, HoldingRow, RiskGroup } from '@/types';

function buildRiskGroups(holdings: HoldingRow[]): { byRiskLevel: RiskGroup[]; totalValue: number } {
  const totalValue = holdings.reduce((sum, h) => sum + h.totalValueKRW, 0);

  const riskGroupMap = new Map<string, { totalValue: number; children: Map<string, number> }>();
  for (const h of holdings) {
    if (!riskGroupMap.has(h.riskLevel)) {
      riskGroupMap.set(h.riskLevel, { totalValue: 0, children: new Map() });
    }
    const group = riskGroupMap.get(h.riskLevel)!;
    group.totalValue += h.totalValueKRW;
    const childLabel = h.subClass ?? h.assetClass;
    group.children.set(childLabel, (group.children.get(childLabel) ?? 0) + h.totalValueKRW);
  }

  const byRiskLevel = Array.from(riskGroupMap.entries())
    .map(([riskLevel, group]) => ({
      riskLevel,
      totalValue: group.totalValue,
      percentage: totalValue > 0 ? Math.round((group.totalValue / totalValue) * 10000) / 100 : 0,
      children: Array.from(group.children.entries())
        .map(([label, value]) => ({
          label,
          value,
          percentage: totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  return { byRiskLevel, totalValue };
}

interface MonthlyAssetViewProps {
  initialData: AssetMonthlyData;
  initialYear: number;
  initialMonth: number;
}

export function MonthlyAssetView({
  initialData,
  initialYear,
  initialMonth,
}: MonthlyAssetViewProps) {
  const [data, setData] = useState<AssetMonthlyData>(initialData);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

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
    allowFutureNavigation: false,
  });

  useEffect(() => {
    if (selectedYear === initialYear && selectedMonth === initialMonth) return;

    const loadData = async () => {
      try {
        setIsFetching(true);
        const result = await apiClient.asset.getMonthly<AssetMonthlyData>(
          selectedYear,
          selectedMonth
        );
        setData(result);
      } catch {
        // Keep previous data on error
      } finally {
        setIsFetching(false);
      }
    };
    loadData();
  }, [selectedYear, selectedMonth, initialYear, initialMonth]);

  useEffect(() => {
    updateRangeFromData(data.availableRange);
  }, [data, updateRangeFromData]);

  const members = useMemo(() => {
    return Array.from(new Set(data.holdings.map(h => h.memberName))).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    if (!selectedMember) return data;

    const filteredHoldings = data.holdings.filter(h => h.memberName === selectedMember);
    const { byRiskLevel, totalValue } = buildRiskGroups(filteredHoldings);

    const holdings = filteredHoldings.map(h => ({
      ...h,
      percentage: totalValue > 0 ? Math.round((h.totalValueKRW / totalValue) * 10000) / 100 : 0,
    }));

    return { ...data, holdings, byRiskLevel, totalValue };
  }, [data, selectedMember]);

  const isEmpty = filteredData.holdings.length === 0 && filteredData.byRiskLevel.length === 0;

  return (
    <PageContainer isFetching={isFetching}>
      <section className="mb-8">
        <MonthSelector
          year={selectedYear}
          month={selectedMonth}
          titleSuffix="자산 현황"
          canPrev={canMovePrev}
          canNext={canMoveNext}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onYearChange={y => setSelectedDate({ year: y, month: selectedMonth })}
          onMonthChange={m => setSelectedDate({ year: selectedYear, month: m })}
        />
      </section>

      {isEmpty ? (
        <EmptyState
          title={`${selectedYear}년 ${selectedMonth}월 자산 스냅샷 데이터가 없습니다.`}
          description="다른 월을 선택하거나 데이터를 추가해주세요."
        />
      ) : (
        <>
          <AssetRiskPieChart
            data={filteredData.byRiskLevel}
            totalValue={filteredData.totalValue}
            members={members}
            selectedMember={selectedMember}
            onMemberChange={setSelectedMember}
          />
          <AssetHoldingTable
            holdings={filteredData.holdings}
            totalValue={filteredData.totalValue}
            members={members}
            selectedMember={selectedMember}
            onMemberChange={setSelectedMember}
          />
        </>
      )}
    </PageContainer>
  );
}
