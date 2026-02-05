'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { MonthSelector } from '@/components/features/navigation';
import { DrillDownPieChart, type DrillDownNode } from './drill-down-pie-chart';
import { PortfolioDetailPanel } from './portfolio-detail-panel';
import {
  PageContainer,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { useMonthNavigation } from '@/hooks';
import { RISK_LEVEL_COLORS } from '@/lib/constants';
import type { AssetMonthlyData, HoldingRow } from '@/types';

type AnalysisDimension = 'riskLevel' | 'assetClass' | 'institution' | 'member';

const DIMENSION_LABELS: Record<AnalysisDimension, string> = {
  riskLevel: '위험등급',
  assetClass: '자산유형',
  institution: '기관별',
  member: '구성원별',
};

function buildDrillDownTree(holdings: HoldingRow[], dimension: AnalysisDimension): DrillDownNode[] {
  const groupMap = new Map<string, HoldingRow[]>();

  for (const h of holdings) {
    let key: string;
    switch (dimension) {
      case 'riskLevel':
        key = h.riskLevel;
        break;
      case 'assetClass':
        key = h.assetClass;
        break;
      case 'institution':
        key = h.institutionName;
        break;
      case 'member':
        key = h.memberName;
        break;
    }
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(h);
  }

  return Array.from(groupMap.entries())
    .map(([key, items]) => {
      const value = items.reduce((sum, h) => sum + h.totalValueKRW, 0);

      // Build children (level 2)
      const subGroupMap = new Map<string, HoldingRow[]>();
      for (const h of items) {
        let subKey: string;
        switch (dimension) {
          case 'riskLevel':
            subKey = h.subClass ?? h.assetClass;
            break;
          case 'assetClass':
            subKey = h.subClass ?? h.institutionName;
            break;
          case 'institution':
            subKey = h.assetClass;
            break;
          case 'member':
            subKey = h.riskLevel;
            break;
        }
        if (!subGroupMap.has(subKey)) subGroupMap.set(subKey, []);
        subGroupMap.get(subKey)!.push(h);
      }

      const children = Array.from(subGroupMap.entries())
        .map(([subKey, subItems]) => {
          const subValue = subItems.reduce((sum, h) => sum + h.totalValueKRW, 0);

          // Level 3: individual items
          const leafChildren =
            subItems.length > 1
              ? subItems
                  .map(h => ({
                    id: h.id,
                    label: h.assetName,
                    value: h.totalValueKRW,
                  }))
                  .sort((a, b) => b.value - a.value)
              : undefined;

          return {
            id: `${key}::${subKey}`,
            label: subKey,
            value: subValue,
            children: leafChildren,
          };
        })
        .sort((a, b) => b.value - a.value);

      // Color assignment
      let color: string | undefined;
      if (dimension === 'riskLevel') {
        color = RISK_LEVEL_COLORS[key];
      }

      return { id: key, label: key, value, color, children };
    })
    .sort((a, b) => b.value - a.value);
}

interface PortfolioAnalysisViewProps {
  initialData: AssetMonthlyData;
  initialYear: number;
  initialMonth: number;
}

export function PortfolioAnalysisView({
  initialData,
  initialYear,
  initialMonth,
}: PortfolioAnalysisViewProps) {
  const searchParams = useSearchParams();
  const initialRiskLevel = searchParams.get('riskLevel');

  const [data, setData] = useState<AssetMonthlyData>(initialData);
  const [isFetching, setIsFetching] = useState(false);
  const [dimension, setDimension] = useState<AnalysisDimension>('riskLevel');
  const [drillPath, setDrillPath] = useState<string[]>([]);

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

  // Auto drill-down from URL param
  useEffect(() => {
    if (initialRiskLevel && dimension === 'riskLevel') {
      setDrillPath([initialRiskLevel]);
    }
  }, [initialRiskLevel, dimension]);

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
        // Keep previous data
      } finally {
        setIsFetching(false);
      }
    };
    loadData();
  }, [selectedYear, selectedMonth, initialYear, initialMonth]);

  useEffect(() => {
    updateRangeFromData(data.availableRange);
  }, [data, updateRangeFromData]);

  const tree = useMemo(() => buildDrillDownTree(data.holdings, dimension), [data, dimension]);

  // Navigate the drill-down tree based on path
  const currentNodes = useMemo(() => {
    let nodes = tree;
    for (const pathId of drillPath) {
      const found = nodes.find(n => n.id === pathId);
      if (found?.children) {
        nodes = found.children;
      } else {
        break;
      }
    }
    return nodes;
  }, [tree, drillPath]);

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    const crumbs = [{ label: '전체', index: 0 }];
    let nodes = tree;
    for (let i = 0; i < drillPath.length; i++) {
      const found = nodes.find(n => n.id === drillPath[i]);
      if (found) {
        crumbs.push({ label: found.label, index: i + 1 });
        nodes = found.children ?? [];
      }
    }
    return crumbs;
  }, [tree, drillPath]);

  // Holdings filtered by drill-down path
  const filteredHoldings = useMemo(() => {
    if (drillPath.length === 0) return data.holdings;

    return data.holdings.filter(h => {
      const path = drillPath;
      const level0Key =
        dimension === 'riskLevel'
          ? h.riskLevel
          : dimension === 'assetClass'
            ? h.assetClass
            : dimension === 'institution'
              ? h.institutionName
              : h.memberName;

      if (path[0] !== level0Key) return false;
      if (path.length < 2) return true;

      // Level 1 match (subgroup key)
      const level1Id = path[1];
      const subKey = level1Id.split('::')[1];
      if (!subKey) return false;

      let actualSubKey: string;
      switch (dimension) {
        case 'riskLevel':
          actualSubKey = h.subClass ?? h.assetClass;
          break;
        case 'assetClass':
          actualSubKey = h.subClass ?? h.institutionName;
          break;
        case 'institution':
          actualSubKey = h.assetClass;
          break;
        case 'member':
          actualSubKey = h.riskLevel;
          break;
      }
      if (actualSubKey !== subKey) return false;
      if (path.length < 3) return true;

      // Level 2 match (individual item)
      return h.id === path[2];
    });
  }, [data.holdings, drillPath, dimension]);

  const filteredTotal = useMemo(
    () => filteredHoldings.reduce((sum, h) => sum + h.totalValueKRW, 0),
    [filteredHoldings]
  );

  const handleDrillDown = useCallback((nodeId: string) => {
    setDrillPath(prev => [...prev, nodeId]);
  }, []);

  const handleBreadcrumbClick = useCallback((index: number) => {
    setDrillPath(prev => prev.slice(0, index));
  }, []);

  const handleDimensionChange = (value: string) => {
    setDimension(value as AnalysisDimension);
    setDrillPath([]);
  };

  const isEmpty = data.holdings.length === 0;

  const detailTitle =
    drillPath.length === 0
      ? `전체 보유 자산`
      : `${breadcrumb[breadcrumb.length - 1]?.label ?? ''} 상세`;

  return (
    <PageContainer isFetching={isFetching}>
      <section className="mb-8">
        <MonthSelector
          year={selectedYear}
          month={selectedMonth}
          titleSuffix="포트폴리오 분석"
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
          title={`${selectedYear}년 ${selectedMonth}월 자산 데이터가 없습니다.`}
          description="다른 월을 선택하거나 데이터를 추가해주세요."
        />
      ) : (
        <Tabs defaultValue="riskLevel" onChange={handleDimensionChange}>
          <div className="mb-6">
            <TabsList>
              {(Object.entries(DIMENSION_LABELS) as [AnalysisDimension, string][]).map(
                ([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                )
              )}
            </TabsList>
          </div>

          {(Object.keys(DIMENSION_LABELS) as AnalysisDimension[]).map(dim => (
            <TabsContent key={dim} value={dim}>
              <DrillDownPieChart
                data={currentNodes}
                breadcrumb={breadcrumb}
                onDrillDown={handleDrillDown}
                onBreadcrumbClick={handleBreadcrumbClick}
                totalValue={data.totalValue}
              />
              <PortfolioDetailPanel
                holdings={filteredHoldings}
                totalValue={filteredTotal}
                title={detailTitle}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </PageContainer>
  );
}
