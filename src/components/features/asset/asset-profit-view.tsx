'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Info } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatKoreanWonCompact, formatExchangeRate } from '@/lib/format-utils';
import { ASSET_CLASS_COLORS, RISK_LEVEL_TEXT_COLORS } from '@/lib/constants';
import { Card, EmptyState, PageContainer } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';
import { AssetPageToolbar } from './asset-page-toolbar';
import type { AssetProfitData, AssetProfitRow } from '@/types';

interface AssetProfitViewProps {
  initialData: AssetProfitData;
  initialYear: number;
  initialMonth: number;
}

type ColumnMeta = { align?: 'left' | 'right' };

function toneClass(value: number | null): string {
  if (value === null || value === 0) return 'text-ink-subtle';
  return value > 0 ? 'text-gain' : 'text-loss';
}

function formatPct(ratio: number): string {
  return `${ratio >= 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%`;
}

const DASH = '—';

export function AssetProfitView({ initialData, initialYear, initialMonth }: AssetProfitViewProps) {
  const [data, setData] = useState<AssetProfitData>(initialData);
  const [isFetching, setIsFetching] = useState(false);
  const [member, setMember] = useState<string | null>(null);
  const [showValue, setShowValue] = useState(false);
  const [riskFilter, setRiskFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'value', desc: true }]);

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

  const loadData = useCallback(async () => {
    try {
      setIsFetching(true);
      const result = await apiClient.asset.getProfit<AssetProfitData>(selectedYear, selectedMonth);
      setData(result);
    } catch {
      // Keep previous data on error.
    } finally {
      setIsFetching(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedYear === initialYear && selectedMonth === initialMonth) return;
    loadData();
  }, [selectedYear, selectedMonth, initialYear, initialMonth, loadData]);

  useEffect(() => {
    updateRangeFromData(data.availableRange);
  }, [data.availableRange, updateRangeFromData]);

  const members = useMemo(
    () =>
      Array.from(new Set(data.rows.map(r => r.memberName))).sort((a, b) =>
        a.localeCompare(b, 'ko-KR')
      ),
    [data.rows]
  );
  const riskLevels = useMemo(
    () =>
      Array.from(new Set(data.rows.map(r => r.riskLevel))).sort((a, b) =>
        a.localeCompare(b, 'ko-KR')
      ),
    [data.rows]
  );

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return data.rows.filter(r => {
      if (!showValue && r.valueType) return false;
      if (member !== null && r.memberName !== member) return false;
      if (riskFilter !== null && r.riskLevel !== riskFilter) return false;
      if (keyword && !r.assetName.toLowerCase().includes(keyword)) return false;
      return true;
    });
  }, [data.rows, showValue, member, riskFilter, search]);

  const summary = useMemo(() => {
    const principal = rows.reduce((s, r) => s + r.principal, 0);
    const value = rows.reduce((s, r) => s + r.value, 0);
    const gain = value - principal;
    const returnRate = principal > 0 ? gain / principal : null;

    // 손익 종목 목록은 평가손익이 0인 value형(현금성)을 빼고 종목형만, 손익 큰 순으로 본다.
    const investRows = rows.filter(r => !r.valueType);
    const gainers = investRows.filter(r => r.gain > 0).sort((a, b) => b.gain - a.gain);
    const losers = investRows.filter(r => r.gain < 0).sort((a, b) => a.gain - b.gain);

    return {
      principal,
      value,
      gain,
      returnRate,
      winCount: gainers.length,
      lossCount: losers.length,
      gainers,
      losers,
    };
  }, [rows]);

  const columns = useMemo<ColumnDef<AssetProfitRow>[]>(
    () => [
      {
        accessorKey: 'assetName',
        header: '종목',
        cell: ({ row }) => {
          const h = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: ASSET_CLASS_COLORS[h.assetClass] ?? 'var(--ink-subtle)' }}
              />
              <div className="min-w-0">
                <div className="font-medium text-ink">{h.assetName}</div>
                <div className="text-xs text-ink-subtle">
                  {h.assetClass}
                  {h.subClass ? ` · ${h.subClass}` : ''} ·{' '}
                  <span className={RISK_LEVEL_TEXT_COLORS[h.riskLevel] ?? ''}>{h.riskLevel}</span>
                  {h.currency === 'KRW' ? '' : ` · ${h.currency}`}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'memberAccount',
        header: '구성원 · 계좌',
        accessorFn: row => `${row.memberName} · ${row.accountName}`,
        cell: ({ getValue }) => <span className="text-ink-muted">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'quantity',
        header: '수량',
        cell: ({ row }) =>
          row.original.valueType ? DASH : row.original.quantity.toLocaleString('ko-KR'),
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'avgCostKRW',
        header: '평균단가',
        cell: ({ row }) =>
          row.original.valueType ? DASH : row.original.avgCostKRW.toLocaleString('ko-KR'),
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'currentPriceKRW',
        header: '현재가',
        cell: ({ row }) => {
          const h = row.original;
          if (h.valueType) return DASH;
          return (
            <span>
              {h.currentPriceKRW.toLocaleString('ko-KR')}
              {h.exchangeRate ? (
                <span className="ml-1 text-[10px] text-ink-faint">
                  @{formatExchangeRate(h.exchangeRate, h.currency)}
                </span>
              ) : null}
            </span>
          );
        },
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'principal',
        header: '원금',
        cell: ({ getValue }) => formatKoreanWonCompact(getValue<number>()),
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'value',
        header: '평가액',
        cell: ({ getValue }) => (
          <span className="font-semibold text-ink">
            {formatKoreanWonCompact(getValue<number>())}
          </span>
        ),
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        id: 'weight',
        header: '비중',
        accessorFn: row => row.value,
        cell: ({ row }) => {
          const pct = summary.value > 0 ? (row.original.value / summary.value) * 100 : 0;
          return `${pct.toFixed(1)}%`;
        },
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'gain',
        header: '평가손익',
        cell: ({ row }) => {
          const h = row.original;
          if (h.valueType) return DASH;
          return (
            <span className={`font-semibold ${toneClass(h.gain)}`}>
              {formatKoreanWonCompact(h.gain, { signed: true })}
            </span>
          );
        },
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'returnRate',
        header: '수익률',
        cell: ({ row }) => {
          const h = row.original;
          if (h.valueType || h.returnRate === null) return DASH;
          return (
            <span className={`font-semibold tabular-nums ${toneClass(h.returnRate)}`}>
              {formatPct(h.returnRate)}
            </span>
          );
        },
        meta: { align: 'right' } satisfies ColumnMeta,
      },
    ],
    [summary.value]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const dateLabel = data.snapshotDate
    ? data.snapshotDate.replace(/-/g, '.')
    : `${selectedYear}.${String(selectedMonth).padStart(2, '0')}`;

  const isEmpty = data.rows.length === 0;

  return (
    <PageContainer isFetching={isFetching}>
      <AssetPageToolbar
        year={selectedYear}
        month={selectedMonth}
        titleSuffix="투자 수익 현황"
        canPrev={canMovePrev}
        canNext={canMoveNext}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onYearChange={year => setSelectedDate({ year, month: selectedMonth })}
        onMonthChange={month => setSelectedDate({ year: selectedYear, month })}
      />

      {isEmpty ? (
        <EmptyState
          title={`${selectedYear}년 ${selectedMonth}월 투자 데이터가 없습니다.`}
          description="월별 현황에서 이번 달 자산을 입력하면 투자 수익 현황이 표시됩니다."
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <HeroSummary dateLabel={dateLabel} summary={summary} />
            <ProfitBreakdownCard summary={summary} />
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-semibold tracking-tight text-ink">
                  종목별 투자 성과
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="종목 검색"
                  className="h-8 w-32 rounded-md border border-hairline bg-surface px-2.5 text-sm text-ink-muted placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <select
                  value={riskFilter ?? ''}
                  onChange={e => setRiskFilter(e.target.value || null)}
                  className="h-8 rounded-md border border-hairline bg-surface px-2 text-sm text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">위험구분 전체</option>
                  {riskLevels.map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <nav className="toggle">
                  <button className={member === null ? 'on' : ''} onClick={() => setMember(null)}>
                    전체
                  </button>
                  {members.map(m => (
                    <button
                      key={m}
                      className={member === m ? 'on' : ''}
                      onClick={() => setMember(m)}
                    >
                      {m}
                    </button>
                  ))}
                </nav>
                <button
                  type="button"
                  onClick={() => setShowValue(v => !v)}
                  className={`h-8 rounded-full border px-3 text-sm font-medium transition ${
                    showValue
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-hairline text-ink-subtle hover:text-ink'
                  }`}
                >
                  현금형 포함
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
              <div className="overflow-auto">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead className="sticky top-0 z-10 bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => {
                          const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                          const alignClass = meta?.align === 'right' ? 'text-right' : 'text-left';
                          const justifyClass =
                            meta?.align === 'right' ? 'justify-end' : 'justify-between';
                          return (
                            <th
                              key={header.id}
                              className={`border-b border-hairline px-3 py-2.5 ${alignClass}`}
                            >
                              <button
                                type="button"
                                onClick={header.column.getToggleSortingHandler()}
                                className={`flex w-full items-center gap-1.5 ${justifyClass}`}
                              >
                                <span>
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </span>
                                {header.column.getIsSorted() ? (
                                  header.column.getIsSorted() === 'asc' ? (
                                    <ArrowUp size={13} />
                                  ) : (
                                    <ArrowDown size={13} />
                                  )
                                ) : (
                                  <ChevronsUpDown size={13} className="text-ink-faint" />
                                )}
                              </button>
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-3 py-8 text-center text-sm text-ink-subtle"
                        >
                          조건에 맞는 종목이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map(row => (
                        <tr
                          key={row.id}
                          className="border-b border-hairline transition-colors hover:bg-canvas"
                        >
                          {row.getVisibleCells().map(cell => {
                            const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                            const alignClass = meta?.align === 'right' ? 'text-right' : 'text-left';
                            return (
                              <td
                                key={cell.id}
                                className={`border-b border-hairline px-3 py-2.5 text-ink-muted ${alignClass}`}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-surface-soft text-sm font-semibold text-ink">
                    <tr>
                      <td className="px-3 py-2.5">합계</td>
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5 text-right">
                        {formatKoreanWonCompact(summary.principal)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {formatKoreanWonCompact(summary.value)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {summary.value > 0 ? '100.0%' : DASH}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${toneClass(summary.gain)}`}>
                        {formatKoreanWonCompact(summary.gain, { signed: true })}
                      </td>
                      <td className={`px-3 py-2.5 text-right ${toneClass(summary.returnRate)}`}>
                        {summary.returnRate === null ? DASH : formatPct(summary.returnRate)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </Card>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-hairline bg-surface-soft p-4 text-sm text-ink-subtle">
            <Info size={18} className="mt-0.5 shrink-0 text-ink-faint" />
            <span>
              현금형 종목(예금·청약 등 value형)은 원금=평가액으로 평가손익이 0이라 기본 성과표에서
              제외됩니다. <b className="font-semibold text-ink-muted">현금형 포함</b>으로 함께 볼 수
              있어요. 평균단가는 스냅샷 수량 변화로 파생되어, 최초 보유 시점은 현재가를 원가로 보아
              평가손익이 0(또는 —)으로 보일 수 있어요.
            </span>
          </div>
        </>
      )}
    </PageContainer>
  );
}

interface ProfitSummary {
  principal: number;
  value: number;
  gain: number;
  returnRate: number | null;
  winCount: number;
  lossCount: number;
  gainers: AssetProfitRow[];
  losers: AssetProfitRow[];
}

// 페이지 목적(원금 대비 미실현 손익)을 헤드라인으로 끌어올린 요약 히어로.
function HeroSummary({ dateLabel, summary }: { dateLabel: string; summary: ProfitSummary }) {
  const { principal, value, gain, returnRate } = summary;
  const isGain = gain >= 0;
  const denom = Math.max(principal, value, 1);
  const basePct = (Math.min(principal, value) / denom) * 100; // 원금·평가액 중 작은 쪽이 기준 막대
  const deltaPct = (Math.abs(gain) / denom) * 100; // 손익만큼 덧대는 막대

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-hairline p-6 shadow-[var(--shadow-1)]"
      style={{ backgroundColor: 'var(--block-cream)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-subtle">투자 성과</p>
        <p className="text-sm text-ink-subtle">{dateLabel} (미실현)</p>
      </div>
      <div className="flex flex-1 items-center py-4">
        <p>
          <span className={`text-4xl font-bold ${toneClass(gain)}`}>
            {formatKoreanWonCompact(gain, { signed: true })}
          </span>
          <span className={`ml-2 text-lg font-semibold ${toneClass(returnRate)}`}>
            ({returnRate === null ? DASH : formatPct(returnRate)})
          </span>
        </p>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-ink-subtle">
            투자 원금{' '}
            <span className="ml-1 font-semibold text-ink">{formatKoreanWonCompact(principal)}</span>
          </span>
          <span className="text-ink-subtle">
            평가액{' '}
            <span className="ml-1 font-semibold text-ink">{formatKoreanWonCompact(value)}</span>
          </span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-soft">
          <div className="bg-ink/20" style={{ width: `${basePct}%` }} />
          <div className={isGain ? 'bg-gain' : 'bg-loss'} style={{ width: `${deltaPct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-end gap-4 text-xs text-ink-subtle">
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-ink/20" />
            {isGain ? '원금' : '평가액'}
          </span>
          <span className="flex items-center gap-1.5">
            <i className={`h-2.5 w-2.5 rounded-sm ${isGain ? 'bg-gain' : 'bg-loss'}`} />
            {isGain ? '평가이익' : '평가손실'}
          </span>
        </div>
      </div>
    </div>
  );
}

// 손익 종목 카드: 이익·손실 상위 종목을 종목·계좌·수익률로 간략히 보여준다(손익 큰 순).
function ProfitBreakdownCard({ summary }: { summary: ProfitSummary }) {
  const items = [...summary.gainers.slice(0, 3), ...summary.losers.slice(0, 3)];

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-subtle">손익 종목</span>
        <span className="text-xs">
          <span className="text-gain">이익 {summary.winCount}</span>
          <span className="text-ink-subtle"> · </span>
          <span className="text-loss">손실 {summary.lossCount}</span>
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 flex-1 text-xs text-ink-subtle">표시할 종목이 없습니다.</p>
      ) : (
        <ul className="mt-3 flex-1 space-y-2.5 overflow-hidden">
          {items.map(r => (
            <li key={r.id} className="flex items-center justify-between gap-2 leading-tight">
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-ink">{r.assetName}</span>
                <span className="block truncate text-[11px] text-ink-subtle">
                  {r.memberName} · {r.accountName}
                </span>
              </span>
              <span className={`shrink-0 text-xs font-semibold tabular-nums ${toneClass(r.gain)}`}>
                {r.returnRate !== null ? formatPct(r.returnRate) : DASH}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
