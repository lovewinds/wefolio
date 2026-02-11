'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { MonthSelector } from '@/components/features/navigation';
import { HoldingTransactionTable } from '@/components/features/asset-transaction';
import type {
  HoldingTransactionRow,
  InstitutionOption,
  AccountOption,
  AssetMasterOption,
  MemberOption,
  HoldingOption,
} from '@/components/features/asset-transaction/types';
import { PageContainer } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';

function AssetTransactionsContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<HoldingTransactionRow[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [assetMasters, setAssetMasters] = useState<AssetMasterOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [holdings, setHoldings] = useState<HoldingOption[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    selectedYear,
    selectedMonth,
    handlePrevMonth,
    handleNextMonth,
    setSelectedDate,
    canMovePrev,
    canMoveNext,
  } = useMonthNavigation({
    initialFromQuery: {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    },
    allowFutureNavigation: true,
  });

  const loadData = useCallback(async () => {
    try {
      setIsFetching(true);
      const [txData, instData, acctData, amData, memberData, holdingData] = await Promise.all([
        apiClient.asset.getTransactions<HoldingTransactionRow[]>(selectedYear, selectedMonth),
        apiClient.asset.getInstitutions<InstitutionOption[]>(),
        apiClient.asset.getAccounts<AccountOption[]>(),
        apiClient.asset.getAssetMasters<AssetMasterOption[]>(),
        apiClient.asset.getMembers<MemberOption[]>(),
        apiClient.asset.getHoldings<HoldingOption[]>(),
      ]);
      setTransactions(txData);
      setInstitutions(instData);
      setAccounts(acctData);
      setAssetMasters(amData);
      setMembers(memberData);
      setHoldings(holdingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsFetching(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!transactions && isFetching) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </main>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-rose-600 dark:text-rose-400">{error}</div>
      </main>
    );
  }

  const actions = (
    <Link
      href={`/asset/monthly?year=${selectedYear}&month=${selectedMonth}`}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      자산 현황
    </Link>
  );

  return (
    <PageContainer isFetching={isFetching}>
      <MonthSelector
        year={selectedYear}
        month={selectedMonth}
        titleSuffix="자산 거래"
        canPrev={canMovePrev}
        canNext={canMoveNext}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onYearChange={y => setSelectedDate({ year: y, month: selectedMonth })}
        onMonthChange={m => setSelectedDate({ year: selectedYear, month: m })}
        actions={actions}
      />

      <HoldingTransactionTable
        transactions={transactions}
        year={selectedYear}
        month={selectedMonth}
        institutions={institutions}
        accounts={accounts}
        assetMasters={assetMasters}
        members={members}
        holdings={holdings}
        onDataChange={loadData}
      />
    </PageContainer>
  );
}

export default function AssetTransactionsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </main>
      }
    >
      <AssetTransactionsContent />
    </Suspense>
  );
}
