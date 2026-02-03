'use client';

import { useEffect, useMemo, useState } from 'react';
import { MonthSelector, LNB } from '@/components/features/navigation';
import { AssetRiskPieChart, AssetHoldingTable } from '@/components/features/asset';
import { useMonthNavigation } from '@/hooks';
import type { HoldingRow } from '@/components/features/asset/asset-holding-table';

interface RiskChild {
  label: string;
  value: number;
  percentage: number;
}

interface RiskGroup {
  riskLevel: string;
  totalValue: number;
  percentage: number;
  children: RiskChild[];
}

interface AssetMonthlyData {
  totalValue: number;
  byRiskLevel: RiskGroup[];
  holdings: HoldingRow[];
  availableRange: {
    min: { year: number; month: number };
    max: { year: number; month: number };
  } | null;
}

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

export default function AssetMonthlyPage() {
  const [data, setData] = useState<AssetMonthlyData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const {
    selectedYear,
    selectedMonth,
    navigationUnit,
    handlePrevMonth,
    handleNextMonth,
    toggleNavigationUnit,
    canMovePrev,
    canMoveNext,
    updateRangeFromData,
  } = useMonthNavigation({
    allowFutureNavigation: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsFetching(true);
        const response = await fetch(
          `/api/asset/monthly?year=${selectedYear}&month=${selectedMonth}`
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error ?? 'Failed to fetch asset data');
        }

        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsFetching(false);
      }
    };
    loadData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (!data) return;
    updateRangeFromData(data.availableRange);
  }, [data, updateRangeFromData]);

  const members = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.holdings.map(h => h.memberName))).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!selectedMember) return data;

    const filteredHoldings = data.holdings.filter(h => h.memberName === selectedMember);
    const { byRiskLevel, totalValue } = buildRiskGroups(filteredHoldings);

    const holdings = filteredHoldings.map(h => ({
      ...h,
      percentage: totalValue > 0 ? Math.round((h.totalValueKRW / totalValue) * 10000) / 100 : 0,
    }));

    return { ...data, holdings, byRiskLevel, totalValue };
  }, [data, selectedMember]);

  if (!data && isFetching) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <LNB />
        <main className="ml-16 flex min-h-screen items-center justify-center">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </main>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <LNB />
        <main className="ml-16 flex min-h-screen items-center justify-center">
          <div className="text-rose-600 dark:text-rose-400">{error}</div>
        </main>
      </div>
    );
  }

  const isEmpty =
    !filteredData || (filteredData.holdings.length === 0 && filteredData.byRiskLevel.length === 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <LNB />
      <main
        className={`ml-16 px-8 py-8 transition-opacity duration-150 ${isFetching ? 'pointer-events-none opacity-50' : ''}`}
      >
        <section className="mb-8">
          <MonthSelector
            year={selectedYear}
            month={selectedMonth}
            navigationUnit={navigationUnit}
            titleSuffix="자산 현황"
            canPrev={canMovePrev}
            canNext={canMoveNext}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToggleNavigationUnit={toggleNavigationUnit}
          />
        </section>

        {isEmpty ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-800">
            <div className="text-center">
              <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
                {selectedYear}년 {selectedMonth}월 자산 스냅샷 데이터가 없습니다.
              </p>
              <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
                다른 월을 선택하거나 데이터를 추가해주세요.
              </p>
            </div>
          </div>
        ) : (
          <>
            <AssetRiskPieChart
              data={filteredData!.byRiskLevel}
              totalValue={filteredData!.totalValue}
              members={members}
              selectedMember={selectedMember}
              onMemberChange={setSelectedMember}
            />
            <AssetHoldingTable
              holdings={filteredData!.holdings}
              totalValue={filteredData!.totalValue}
              members={members}
              selectedMember={selectedMember}
              onMemberChange={setSelectedMember}
            />
          </>
        )}
      </main>
    </div>
  );
}
