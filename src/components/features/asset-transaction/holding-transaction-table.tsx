'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Trash2 } from 'lucide-react';
import { formatAmount } from '@/lib/format-utils';
import { HOLDING_TRANSACTION_TYPE_LABELS } from '@/lib/constants';
import { apiClient } from '@/lib/api-client';
import { useHoldingTransactionInputRows } from '@/hooks';
import { HoldingTransactionInputRowComponent } from './holding-transaction-input-row';
import type {
  HoldingTransactionRow,
  InstitutionOption,
  AccountOption,
  AssetMasterOption,
  MemberOption,
  HoldingOption,
  HoldingTransactionInputRowRef,
} from './types';

interface HoldingTransactionTableProps {
  transactions: HoldingTransactionRow[];
  year: number;
  month: number;
  institutions: InstitutionOption[];
  accounts: AccountOption[];
  assetMasters: AssetMasterOption[];
  members: MemberOption[];
  holdings: HoldingOption[];
  onDataChange?: () => void;
}

const columnWidths = {
  action: '40px',
  date: '110px',
  member: '80px',
  institution: '120px',
  account: '160px',
  asset: '160px',
  type: '80px',
  quantity: '90px',
  priceOriginal: '110px',
  priceKRW: '110px',
  exchangeRate: '90px',
  totalKRW: '120px',
  notes: '150px',
} as const;

export function HoldingTransactionTable({
  transactions,
  year,
  month,
  institutions,
  accounts,
  assetMasters,
  members,
  holdings,
  onDataChange,
}: HoldingTransactionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [localInstitutions, setLocalInstitutions] = useState(institutions);
  const [localAccounts, setLocalAccounts] = useState(accounts);
  const [localAssetMasters, setLocalAssetMasters] = useState(assetMasters);

  useEffect(() => {
    setLocalInstitutions(institutions);
  }, [institutions]);
  useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);
  useEffect(() => {
    setLocalAssetMasters(assetMasters);
  }, [assetMasters]);

  const defaultDate = useMemo(() => {
    const paddedMonth = String(month).padStart(2, '0');
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() + 1 === month) {
      const paddedDay = String(today.getDate()).padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
    return `${year}-${paddedMonth}-01`;
  }, [year, month]);

  const {
    rows: inputRows,
    handleCellChange,
    handleCellKeyDown,
    handleCellFocus,
    handleSaveRow,
    canSaveRow,
    rowRefs,
    resetRows,
  } = useHoldingTransactionInputRows({
    defaultDate,
    onSaved: () => {
      onDataChange?.();
    },
  });

  useEffect(() => {
    resetRows();
  }, [year, month, resetRows]);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return;

    setIsDeleting(id);
    try {
      await apiClient.asset.deleteTransaction(id);
      onDataChange?.();
    } catch (error) {
      console.error('Delete error:', error);
      alert('거래 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleInstitutionCreated = (inst: InstitutionOption) => {
    setLocalInstitutions(prev => [...prev, inst]);
  };

  const handleAccountCreated = (acc: AccountOption) => {
    setLocalAccounts(prev => [...prev, acc]);
  };

  const handleAssetMasterCreated = (am: AssetMasterOption) => {
    setLocalAssetMasters(prev => [...prev, am]);
  };

  const columns = useMemo<ColumnDef<HoldingTransactionRow>[]>(
    () => [
      {
        accessorKey: 'date',
        header: '날짜',
        meta: { width: columnWidths.date },
      },
      {
        accessorKey: 'memberName',
        header: '소유자',
        meta: { width: columnWidths.member },
      },
      {
        accessorKey: 'institutionName',
        header: '기관',
        meta: { width: columnWidths.institution },
      },
      {
        id: 'accountWithMember',
        header: '계좌',
        accessorFn: row => `${row.accountName} (${row.memberName})`,
        meta: { width: columnWidths.account },
      },
      {
        accessorKey: 'assetName',
        header: '종목',
        meta: { width: columnWidths.asset },
      },
      {
        accessorKey: 'transactionType',
        header: '유형',
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return HOLDING_TRANSACTION_TYPE_LABELS[val] ?? val;
        },
        meta: { width: columnWidths.type },
      },
      {
        accessorKey: 'quantity',
        header: '수량',
        cell: ({ getValue }) => getValue<number>().toLocaleString('ko-KR'),
        meta: { width: columnWidths.quantity, align: 'right' },
      },
      {
        accessorKey: 'priceOriginal',
        header: '원가',
        cell: ({ getValue }) => formatAmount(getValue<number>()),
        meta: { width: columnWidths.priceOriginal, align: 'right' },
      },
      {
        accessorKey: 'priceKRW',
        header: '원화가격',
        cell: ({ getValue }) => formatAmount(getValue<number>()),
        meta: { width: columnWidths.priceKRW, align: 'right' },
      },
      {
        accessorKey: 'exchangeRate',
        header: '환율',
        cell: ({ getValue }) => {
          const val = getValue<number | null>();
          return val ? val.toLocaleString('ko-KR') : '-';
        },
        meta: { width: columnWidths.exchangeRate, align: 'right' },
      },
      {
        accessorKey: 'totalKRW',
        header: '총액(KRW)',
        cell: ({ getValue }) => formatAmount(getValue<number>()),
        meta: { width: columnWidths.totalKRW, align: 'right' },
      },
      {
        accessorKey: 'notes',
        header: '메모',
        cell: ({ getValue }) => getValue<string | null>() ?? '-',
        meta: { width: columnWidths.notes },
      },
    ],
    []
  );

  const filteredTransactions = useMemo(
    () =>
      selectedMemberId
        ? transactions.filter(t => {
            const account = localAccounts.find(a => a.id === t.accountId);
            return account?.memberId === selectedMemberId;
          })
        : transactions,
    [transactions, selectedMemberId, localAccounts]
  );

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rowPadding = 'py-2';

  const totalColSpan = columns.length + 1;

  const selectedMemberName = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find(m => m.id === selectedMemberId)?.name ?? null;
  }, [selectedMemberId, members]);

  const memberFilteredAccounts = useMemo(() => {
    if (!selectedMemberId) return localAccounts;
    return localAccounts.filter(a => a.memberId === selectedMemberId);
  }, [localAccounts, selectedMemberId]);

  const accountAssetMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const h of holdings) {
      let set = map.get(h.accountId);
      if (!set) {
        set = new Set<string>();
        map.set(h.accountId, set);
      }
      set.add(h.assetMasterId);
    }
    return map;
  }, [holdings]);

  const memberFilteredInstitutions = useMemo(() => {
    if (!selectedMemberId) return localInstitutions;
    const instIds = new Set(memberFilteredAccounts.map(a => a.institutionId));
    return localInstitutions.filter(i => instIds.has(i.id));
  }, [localInstitutions, selectedMemberId, memberFilteredAccounts]);

  const handleMemberChange = (memberId: string | null) => {
    setSelectedMemberId(memberId);
    resetRows();
  };

  return (
    <section className="mt-6 space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex rounded-full bg-surface-soft p-1 text-sm font-medium text-ink-muted">
          {[
            { value: null, label: '전체' },
            ...members.map(m => ({ value: m.id, label: m.name })),
          ].map(option => {
            const isActive = option.value === selectedMemberId;
            return (
              <button
                key={option.label}
                type="button"
                className={`rounded-full px-3 py-1.5 transition ${
                  isActive
                    ? 'bg-surface text-ink shadow-[var(--shadow-1)]'
                    : 'text-ink-subtle hover:text-ink'
                }`}
                onClick={() => handleMemberChange(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] table-fixed border-separate border-spacing-0 text-sm">
            <colgroup>
              <col style={{ width: columnWidths.action }} />
              <col style={{ width: columnWidths.date }} />
              <col style={{ width: columnWidths.member }} />
              <col style={{ width: columnWidths.institution }} />
              <col style={{ width: columnWidths.account }} />
              <col style={{ width: columnWidths.asset }} />
              <col style={{ width: columnWidths.type }} />
              <col style={{ width: columnWidths.quantity }} />
              <col style={{ width: columnWidths.priceOriginal }} />
              <col style={{ width: columnWidths.priceKRW }} />
              <col style={{ width: columnWidths.exchangeRate }} />
              <col style={{ width: columnWidths.totalKRW }} />
              <col style={{ width: columnWidths.notes }} />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  <th className="border-b border-r border-hairline px-2 py-2 text-center align-top">
                    <span className="sr-only">액션</span>
                  </th>
                  {headerGroup.headers.map(header => {
                    const meta = header.column.columnDef.meta as
                      | { width?: string; align?: string }
                      | undefined;
                    const alignClass =
                      meta?.align === 'right'
                        ? 'text-right'
                        : meta?.align === 'center'
                          ? 'text-center'
                          : 'text-left';
                    return (
                      <th
                        key={header.id}
                        className={`border-b border-r border-hairline px-3 py-2 align-top ${alignClass}`}
                      >
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <span>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getIsSorted() ? (
                            header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp size={14} />
                            ) : (
                              <ArrowDown size={14} />
                            )
                          ) : (
                            <ChevronsUpDown size={14} className="text-ink-faint" />
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
                    colSpan={totalColSpan}
                    className="px-3 py-8 text-center text-sm text-ink-subtle"
                  >
                    이 달의 자산 거래가 없습니다.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-hairline transition-colors hover:bg-canvas"
                  >
                    <td className={`border-r border-hairline px-2 ${rowPadding} text-center`}>
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(row.original.id)}
                        disabled={isDeleting === row.original.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-loss/10 hover:text-loss disabled:opacity-50"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                    {row.getVisibleCells().map(cell => {
                      const meta = cell.column.columnDef.meta as
                        | { width?: string; align?: string }
                        | undefined;
                      const alignClass =
                        meta?.align === 'right'
                          ? 'text-right'
                          : meta?.align === 'center'
                            ? 'text-center'
                            : 'text-left';
                      return (
                        <td
                          key={cell.id}
                          className={`border-r border-hairline px-3 ${rowPadding} text-ink-muted ${alignClass}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>

            {/* Summary */}
            <tbody>
              <tr className="bg-surface-soft">
                <td
                  colSpan={totalColSpan}
                  className="border-t border-hairline px-4 py-3 text-xs text-ink-muted"
                >
                  <div className="flex items-center gap-3">
                    <span>
                      건수{' '}
                      <span className="font-semibold text-ink">{filteredTransactions.length}</span>
                      건
                      {selectedMemberId && filteredTransactions.length !== transactions.length && (
                        <span className="ml-1 text-ink-subtle">/ 전체 {transactions.length}건</span>
                      )}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>

            {/* Input section */}
            <tbody className="text-xs text-ink-muted">
              <tr className="border-b-2 border-dashed border-hairline bg-surface-soft">
                <td colSpan={totalColSpan} className="px-3 py-2">
                  <span className="text-xs font-medium text-ink-subtle">새 자산 거래 입력</span>
                </td>
              </tr>
              <tr className="bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                <td className="border-b border-r border-hairline px-2 py-1.5 text-center">
                  <span className="sr-only">저장</span>
                </td>
                <td className="border-b border-r border-hairline px-3 py-1.5">날짜</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">소유자</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">기관</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">계좌</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">종목</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">유형</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">수량</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">원가</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">원화가격</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">환율</td>
                <td className="border-b border-r border-hairline px-3 py-1.5">총액(KRW)</td>
                <td className="border-b border-hairline px-3 py-1.5">메모</td>
              </tr>
              {inputRows.map((row, idx) => (
                <HoldingTransactionInputRowComponent
                  key={row.id}
                  ref={(r: HoldingTransactionInputRowRef | null) => {
                    if (r) {
                      rowRefs.current.set(idx, r);
                    } else {
                      rowRefs.current.delete(idx);
                    }
                  }}
                  row={row}
                  rowIndex={idx}
                  institutions={memberFilteredInstitutions}
                  accounts={memberFilteredAccounts}
                  assetMasters={localAssetMasters}
                  accountAssetMap={accountAssetMap}
                  members={members}
                  selectedMemberName={selectedMemberName}
                  defaultMemberId={selectedMemberId}
                  rowPadding={rowPadding}
                  onCellChange={handleCellChange}
                  onCellKeyDown={handleCellKeyDown}
                  onCellFocus={handleCellFocus}
                  onSave={handleSaveRow}
                  canSave={canSaveRow(idx)}
                  onInstitutionCreated={handleInstitutionCreated}
                  onAccountCreated={handleAccountCreated}
                  onAssetMasterCreated={handleAssetMasterCreated}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
