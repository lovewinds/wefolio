'use client';

import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import { RISK_LEVEL_TEXT_COLORS } from '@/lib/constants';
import type { HoldingRow } from '@/types';

interface MemberFilterProps {
  members: string[];
  selectedMember: string | null;
  onMemberChange: (member: string | null) => void;
}

interface AssetHoldingTableProps extends MemberFilterProps {
  holdings: HoldingRow[];
  totalValue: number;
}

type ColumnMeta = {
  filter?: 'text' | 'select';
  options?: string[];
  align?: 'left' | 'right';
};

const textFilter: FilterFn<HoldingRow> = (row, columnId, filterValue) => {
  const value = String(row.getValue(columnId) ?? '');
  const input = String(filterValue ?? '').trim();
  if (!input) return true;
  return value.toLowerCase().includes(input.toLowerCase());
};

const selectFilter: FilterFn<HoldingRow> = (row, columnId, filterValue) => {
  const value = row.getValue<string>(columnId);
  if (!filterValue) return true;
  return value === filterValue;
};

const baseInputClass =
  'h-7 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400';

function renderColumnFilter(column: Column<HoldingRow, unknown>) {
  const meta = column.columnDef.meta as ColumnMeta | undefined;
  if (!meta?.filter) return null;

  if (meta.filter === 'text') {
    return (
      <input
        className={baseInputClass}
        value={(column.getFilterValue() as string) ?? ''}
        onChange={e => column.setFilterValue(e.target.value || undefined)}
        placeholder="검색"
      />
    );
  }

  if (meta.filter === 'select') {
    return (
      <select
        className={baseInputClass}
        value={(column.getFilterValue() as string) ?? ''}
        onChange={e => column.setFilterValue(e.target.value || undefined)}
      >
        <option value="">전체</option>
        {meta.options?.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return null;
}

export function AssetHoldingTable({
  holdings,
  totalValue,
  members,
  selectedMember,
  onMemberChange,
}: AssetHoldingTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalValueKRW', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const assetClasses = useMemo(
    () => Array.from(new Set(holdings.map(h => h.assetClass))).sort(),
    [holdings]
  );
  const riskLevels = useMemo(
    () => Array.from(new Set(holdings.map(h => h.riskLevel))).sort(),
    [holdings]
  );
  const institutions = useMemo(
    () => Array.from(new Set(holdings.map(h => h.institutionName))).sort(),
    [holdings]
  );
  const memberNames = useMemo(
    () => Array.from(new Set(holdings.map(h => h.memberName))).sort(),
    [holdings]
  );

  const columns = useMemo<ColumnDef<HoldingRow>[]>(
    () => [
      {
        accessorKey: 'riskLevel',
        header: '위험등급',
        cell: ({ getValue }) => {
          const level = getValue<string>();
          return (
            <span className={`text-xs font-semibold ${RISK_LEVEL_TEXT_COLORS[level] ?? ''}`}>
              {level}
            </span>
          );
        },
        filterFn: selectFilter,
        meta: { filter: 'select', options: riskLevels } satisfies ColumnMeta,
      },
      {
        accessorKey: 'assetClass',
        header: '자산유형',
        cell: ({ row }) => {
          const subClass = row.original.subClass;
          const assetClass = row.original.assetClass;
          return subClass ? `${assetClass} > ${subClass}` : assetClass;
        },
        filterFn: selectFilter,
        meta: { filter: 'select', options: assetClasses } satisfies ColumnMeta,
      },
      {
        accessorKey: 'institutionName',
        header: '기관',
        filterFn: selectFilter,
        meta: { filter: 'select', options: institutions } satisfies ColumnMeta,
      },
      {
        accessorKey: 'assetName',
        header: '자산명',
        cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
        filterFn: textFilter,
        meta: { filter: 'text' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'totalValueKRW',
        header: '평가금액',
        cell: ({ getValue }) => (
          <span className="font-semibold">{formatAmount(getValue<number>())}</span>
        ),
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'percentage',
        header: '비율',
        cell: ({ getValue }) => `${getValue<number>().toFixed(1)}%`,
        meta: { align: 'right' } satisfies ColumnMeta,
      },
      {
        accessorKey: 'memberName',
        header: '소유자',
        filterFn: selectFilter,
        meta: { filter: 'select', options: memberNames } satisfies ColumnMeta,
      },
    ],
    [assetClasses, riskLevels, memberNames, institutions]
  );

  const table = useReactTable({
    data: holdings,
    columns,
    state: { sorting, columnFilters },
    filterFns: { textFilter, selectFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const filteredTotal = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.original.totalValueKRW, 0),
    [filteredRows]
  );

  return (
    <Card className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">보유 자산 상세</h3>
        <div className="flex rounded-full bg-zinc-100 p-1 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
          {[{ value: null, label: '전체' }, ...members.map(m => ({ value: m, label: m }))].map(
            option => {
              const isActive = option.value === selectedMember;
              return (
                <button
                  key={option.label}
                  type="button"
                  className={`rounded-full px-3 py-1.5 transition ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white'
                  }`}
                  onClick={() => onMemberChange(option.value)}
                >
                  {option.label}
                </button>
              );
            }
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                    const alignClass = meta?.align === 'right' ? 'text-right' : 'text-left';
                    return (
                      <th
                        key={header.id}
                        className={`border-b border-r border-zinc-200 px-3 py-2 align-top dark:border-zinc-700 ${alignClass}`}
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
                            <ChevronsUpDown size={14} className="text-zinc-300" />
                          )}
                        </button>
                        <div className="mt-2">{renderColumnFilter(header.column)}</div>
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
                    className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    조건에 맞는 자산이 없습니다.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
                  >
                    {row.getVisibleCells().map(cell => {
                      const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                      const alignClass = meta?.align === 'right' ? 'text-right' : 'text-left';
                      return (
                        <td
                          key={cell.id}
                          className={`border-r border-zinc-200 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200 ${alignClass}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: total */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-200 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <span>
            종목 수{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              {filteredRows.length}
            </span>
            개
            {filteredRows.length !== holdings.length && (
              <span className="text-zinc-400 dark:text-zinc-500"> / {holdings.length}</span>
            )}
          </span>
          <span>
            합계{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              {formatAmount(filteredTotal)}
            </span>
            {filteredRows.length !== holdings.length && (
              <span className="text-zinc-400 dark:text-zinc-500">
                {' '}
                / {formatAmount(totalValue)}
              </span>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}
