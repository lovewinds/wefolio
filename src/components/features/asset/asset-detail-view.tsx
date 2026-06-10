'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { AssetHoldingTable } from './asset-holding-table';
import { AssetPageToolbar } from './asset-page-toolbar';
import { HoldingTransactionTable } from '@/components/features/asset-transaction';
import { EmptyState, PageContainer } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';
import type { AssetMonthlyDataWithDelta } from '@/types';
import type {
  AccountOption,
  AssetMasterOption,
  HoldingOption,
  HoldingTransactionRow,
  InstitutionOption,
  MemberOption,
} from '@/components/features/asset-transaction/types';

interface AssetDetailViewProps {
  initialData: AssetMonthlyDataWithDelta;
  initialYear: number;
  initialMonth: number;
}

export function AssetDetailView({ initialData, initialYear, initialMonth }: AssetDetailViewProps) {
  const [data, setData] = useState<AssetMonthlyDataWithDelta>(initialData);
  const [transactions, setTransactions] = useState<HoldingTransactionRow[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [assetMasters, setAssetMasters] = useState<AssetMasterOption[]>([]);
  const [transactionMembers, setTransactionMembers] = useState<MemberOption[]>([]);
  const [transactionHoldings, setTransactionHoldings] = useState<HoldingOption[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
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
    allowFutureNavigation: false,
  });

  const loadDetailData = useCallback(async () => {
    try {
      setIsFetching(true);
      const [monthlyData, txData, instData, acctData, amData, memberData, holdingData] =
        await Promise.all([
          apiClient.asset.getMonthlyWithDelta<AssetMonthlyDataWithDelta>(
            selectedYear,
            selectedMonth
          ),
          apiClient.asset.getTransactions<HoldingTransactionRow[]>(selectedYear, selectedMonth),
          apiClient.asset.getInstitutions<InstitutionOption[]>(),
          apiClient.asset.getAccounts<AccountOption[]>(),
          apiClient.asset.getAssetMasters<AssetMasterOption[]>(),
          apiClient.asset.getMembers<MemberOption[]>(),
          apiClient.asset.getHoldings<HoldingOption[]>(),
        ]);

      setData(monthlyData);
      setTransactions(txData);
      setInstitutions(instData);
      setAccounts(acctData);
      setAssetMasters(amData);
      setTransactionMembers(memberData);
      setTransactionHoldings(holdingData);
    } catch {
      // Keep previous data on error.
    } finally {
      setIsFetching(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadDetailData();
  }, [loadDetailData]);

  useEffect(() => {
    updateRangeFromData(data.availableRange);
  }, [data.availableRange, updateRangeFromData]);

  const members = useMemo(() => {
    return Array.from(new Set(data.holdings.map(h => h.memberName))).sort();
  }, [data.holdings]);

  const filteredHoldings = useMemo(() => {
    if (!selectedMember) return data.holdings;
    return data.holdings.filter(h => h.memberName === selectedMember);
  }, [data.holdings, selectedMember]);

  const filteredTotal = useMemo(
    () => filteredHoldings.reduce((sum, h) => sum + h.totalValueKRW, 0),
    [filteredHoldings]
  );

  const isEmpty = data.holdings.length === 0 && transactions.length === 0;

  return (
    <PageContainer isFetching={isFetching}>
      <AssetPageToolbar
        year={selectedYear}
        month={selectedMonth}
        titleSuffix="자산 상세"
        canPrev={canMovePrev}
        canNext={canMoveNext}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onYearChange={year => setSelectedDate({ year, month: selectedMonth })}
        onMonthChange={month => setSelectedDate({ year: selectedYear, month })}
      />

      {isEmpty ? (
        <EmptyState
          title={`${selectedYear}년 ${selectedMonth}월 자산 상세 데이터가 없습니다.`}
          description="월별 현황에서 자산 스냅샷을 입력하거나 거래 기록을 추가해주세요."
        />
      ) : (
        <>
          <AssetHoldingTable
            holdings={filteredHoldings}
            totalValue={filteredTotal}
            members={members}
            selectedMember={selectedMember}
            onMemberChange={setSelectedMember}
          />
          <HoldingTransactionTable
            transactions={transactions}
            year={selectedYear}
            month={selectedMonth}
            institutions={institutions}
            accounts={accounts}
            assetMasters={assetMasters}
            members={transactionMembers}
            holdings={transactionHoldings}
            onDataChange={loadDetailData}
          />
        </>
      )}
    </PageContainer>
  );
}
