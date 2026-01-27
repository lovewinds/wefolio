'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, RotateCcw, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { formatAmount, type DashboardTransaction } from '@/lib/mock-data';
import type { CategoryGroup, TransactionType } from '@/types';
import { useInputRows } from '@/hooks';
import { InputTableRow } from './input-table-row';
import type { InputTableRowRef } from './types';

type DateFilter = { date?: string };

type ColumnMeta = {
  filter?: 'text' | 'select' | 'date';
  options?: string[];
  groupedOptions?: Array<{ label: string; options: Array<{ value: string; label: string }> }>;
  placeholder?: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
};

const parseDateValue = (value: string): Date | null => {
  if (!value) return null;
  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return new Date(Date.UTC(year, month - 1, day));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const dateFilter: FilterFn<DashboardTransaction> = (row, columnId, filterValue) => {
  const value = row.getValue<string>(columnId);
  const filter = filterValue as DateFilter | undefined;
  if (!filter?.date) return true;
  const date = parseDateValue(value);
  const target = parseDateValue(filter.date);
  if (!date || !target) return false;
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
};

const selectFilter: FilterFn<DashboardTransaction> = (row, columnId, filterValue) => {
  const value = row.getValue<string | undefined>(columnId);
  if (!filterValue) return true;
  return value === filterValue;
};

const textFilter: FilterFn<DashboardTransaction> = (row, columnId, filterValue) => {
  const value = row.getValue<string | undefined>(columnId) ?? '';
  const input = String(filterValue ?? '').trim();
  if (!input) return true;
  return value.toLowerCase().includes(input.toLowerCase());
};

const globalTextFilter: FilterFn<DashboardTransaction> = (row, _columnId, filterValue) => {
  const input = String(filterValue ?? '')
    .trim()
    .toLowerCase();
  if (!input) return true;
  const { category, description, paymentMethod, user, type, date } = row.original;
  const combined = [category, description, paymentMethod, user, type, date]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return combined.includes(input);
};

const baseInputClass =
  'h-7 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400';

const columnWidths = {
  action: '40px',
  date: '120px',
  category: '180px',
  type: '72px',
  paymentMethod: '130px',
  user: '90px',
  amount: '130px',
  description: '240px',
} as const;

interface MonthlyDetailTableProps {
  transactions: DashboardTransaction[];
  year: number;
  month: number;
  paymentMethods?: string[];
  users?: string[];
  onDataChange?: () => void;
}

export function MonthlyDetailTable({
  transactions,
  year,
  month,
  paymentMethods: paymentMethodOverrides,
  users: userOverrides,
  onDataChange,
}: MonthlyDetailTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('compact');
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [inputTransactionType, setInputTransactionType] = useState<TransactionType>('expense');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Default date for input rows (first day of selected month)
  const defaultDate = useMemo(() => {
    const paddedMonth = String(month).padStart(2, '0');
    const today = new Date();
    // If it's the current month, use today's date; otherwise use the first of the month
    if (today.getFullYear() === year && today.getMonth() + 1 === month) {
      const paddedDay = String(today.getDate()).padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
    return `${year}-${paddedMonth}-01`;
  }, [year, month]);

  // Filter category groups by transaction type for input rows
  const inputCategoryGroups = useMemo(() => {
    return categoryGroups.filter(group => {
      const groupType = (group as CategoryGroup & { _type?: string })._type;
      return groupType === inputTransactionType && group.children && group.children.length > 0;
    });
  }, [categoryGroups, inputTransactionType]);

  const {
    rows: inputRows,
    handleCellChange,
    handleCellKeyDown,
    handleCellFocus,
    handleSaveRow,
    canSaveRow,
    rowRefs,
    resetRows,
  } = useInputRows({
    defaultDate,
    transactionType: inputTransactionType,
    onSaved: () => {
      onDataChange?.();
    },
  });

  useEffect(() => {
    resetRows();
  }, [year, month, resetRows]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [expenseResponse, incomeResponse] = await Promise.all([
          fetch('/api/categories?type=expense&grouped=true'),
          fetch('/api/categories?type=income&grouped=true'),
        ]);
        const [expenseResult, incomeResult] = await Promise.all([
          expenseResponse.json(),
          incomeResponse.json(),
        ]);
        const nextGroups: CategoryGroup[] = [];

        if (expenseResult?.success && Array.isArray(expenseResult.data)) {
          // Mark expense groups
          expenseResult.data.forEach((g: CategoryGroup) => {
            nextGroups.push({ ...g, id: `expense-${g.id}`, _type: 'expense' } as CategoryGroup & {
              _type: string;
            });
          });
        }
        if (incomeResult?.success && Array.isArray(incomeResult.data)) {
          // Mark income groups
          incomeResult.data.forEach((g: CategoryGroup) => {
            nextGroups.push({ ...g, id: `income-${g.id}`, _type: 'income' } as CategoryGroup & {
              _type: string;
            });
          });
        }

        setCategoryGroups(nextGroups);
      } catch (error) {
        console.error('Failed to fetch category groups:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return;

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      onDataChange?.();
    } catch (error) {
      console.error('Delete error:', error);
      alert('거래 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(null);
    }
  };

  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  const groupedCategoryOptions = useMemo(() => {
    if (categoryGroups.length === 0) return [];
    return categoryGroups
      .map(group => ({
        label: `${group.icon || ''} ${group.name}`.trim(),
        options:
          group.children?.map(child => ({
            value: child.name,
            label: `${child.icon || ''} ${child.name}`.trim(),
          })) ?? [],
      }))
      .filter(group => group.options.length > 0);
  }, [categoryGroups]);

  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    categoryGroups.forEach(group => {
      const parentLabel = group.name;
      group.children?.forEach(child => {
        const parentName = child.parentName || parentLabel;
        map.set(child.name, `${parentName} > ${child.name}`);
      });
    });
    return map;
  }, [categoryGroups]);

  const formatCategoryLabel = useMemo(
    () => (category: string) => categoryLabelMap.get(category) ?? category,
    [categoryLabelMap]
  );

  const paymentMethods = useMemo(() => {
    const values = new Set(paymentMethodOverrides ?? []);
    transactions.forEach(transaction => {
      if (transaction.paymentMethod) values.add(transaction.paymentMethod);
    });
    return Array.from(values).sort();
  }, [paymentMethodOverrides, transactions]);

  const users = useMemo(() => {
    const values = new Set(userOverrides ?? []);
    transactions.forEach(transaction => {
      if (transaction.user) values.add(transaction.user);
    });
    return Array.from(values).sort();
  }, [transactions, userOverrides]);

  const columns = useMemo<ColumnDef<DashboardTransaction>[]>(
    () => [
      {
        accessorKey: 'date',
        header: '날짜',
        cell: ({ getValue }) => {
          const raw = getValue<string>();
          if (/^\d{8}$/.test(raw)) {
            return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
          }
          return raw;
        },
        sortingFn: (rowA, rowB, columnId) => {
          const a = parseDateValue(rowA.getValue(columnId));
          const b = parseDateValue(rowB.getValue(columnId));
          if (!a || !b) return 0;
          return a.getTime() - b.getTime();
        },
        filterFn: dateFilter,
        meta: { filter: 'date', align: 'left', width: columnWidths.date } satisfies ColumnMeta,
      },
      {
        accessorKey: 'category',
        header: '카테고리',
        cell: ({ getValue }) => formatCategoryLabel(getValue<string>()),
        filterFn: selectFilter,
        meta: {
          filter: 'select',
          options: categories,
          groupedOptions: groupedCategoryOptions,
          align: 'left',
          width: columnWidths.category,
        } satisfies ColumnMeta,
      },
      {
        accessorKey: 'type',
        header: '유형',
        cell: ({ getValue }) => (getValue<string>() === 'income' ? '수입' : '지출'),
        filterFn: selectFilter,
        meta: {
          filter: 'select',
          options: ['income', 'expense'],
          align: 'left',
          width: columnWidths.type,
        } satisfies ColumnMeta,
      },
      {
        accessorKey: 'paymentMethod',
        header: '결제 수단',
        cell: ({ getValue }) => getValue<string>() ?? '-',
        filterFn: selectFilter,
        meta: {
          filter: 'select',
          options: paymentMethods,
          align: 'left',
          width: columnWidths.paymentMethod,
        } satisfies ColumnMeta,
      },
      {
        accessorKey: 'user',
        header: '사용자',
        cell: ({ getValue }) => getValue<string>() ?? '-',
        filterFn: selectFilter,
        meta: {
          filter: 'select',
          options: users,
          align: 'left',
          width: columnWidths.user,
        } satisfies ColumnMeta,
      },
      {
        accessorKey: 'amount',
        header: '금액',
        cell: ({ getValue, row }) => {
          const amount = getValue<number>();
          const type = row.original.type;
          return (
            <span
              className={
                type === 'income'
                  ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                  : 'font-semibold text-rose-600 dark:text-rose-400'
              }
            >
              {type === 'income' ? '+' : '-'}
              {formatAmount(amount)}
            </span>
          );
        },
        sortingFn: 'basic',
        meta: { align: 'right', width: columnWidths.amount } satisfies ColumnMeta,
      },
      {
        accessorKey: 'description',
        header: '메모',
        cell: ({ getValue }) => getValue<string>() ?? '-',
        filterFn: textFilter,
        meta: {
          filter: 'text',
          placeholder: '메모 검색',
          align: 'left',
          width: columnWidths.description,
        } satisfies ColumnMeta,
      },
    ],
    [categories, formatCategoryLabel, groupedCategoryOptions, paymentMethods, users]
  );

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    filterFns: {
      dateFilter,
      selectFilter,
      textFilter,
    },
    globalFilterFn: globalTextFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const filteredSummary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const amount = row.original.amount;
        if (row.original.type === 'income') {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredRows]);

  const netAmount = filteredSummary.income - filteredSummary.expense;

  const exportRows = () => {
    const rows = filteredRows.map(row => row.original);
    const sheetData = rows.map(item => ({
      날짜: item.date,
      카테고리: formatCategoryLabel(item.category),
      유형: item.type === 'income' ? '수입' : '지출',
      결제수단: item.paymentMethod ?? '-',
      사용자: item.user ?? '-',
      금액: item.amount,
      메모: item.description ?? '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Detail');
    XLSX.writeFile(workbook, 'monthly-transactions.xlsx');
  };

  const resetFilters = () => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
    setGlobalFilter('');
  };

  const rowPadding = density === 'compact' ? 'py-2' : 'py-3';

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={globalFilter ?? ''}
            onChange={event => setGlobalFilter(event.target.value)}
            placeholder="검색: 카테고리/메모/사용자"
            className="h-9 min-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw size={14} />
            필터 초기화
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                density === 'comfortable'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              기본
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                density === 'compact'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              촘촘
            </button>
          </div>

          <details className="relative">
            <summary className="list-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
              컬럼 보기
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-600 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {table.getAllLeafColumns().map(column => (
                <label key={column.id} className="flex items-center gap-2 px-2 py-1">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600"
                  />
                  <span>{String(column.columnDef.header)}</span>
                </label>
              ))}
            </div>
          </details>

          <Button variant="secondary" size="sm" onClick={exportRows}>
            <Download size={14} />
            엑셀 저장
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {/* Action column header */}
                  <th
                    className="border-b border-r border-zinc-200 px-2 py-2 text-center align-top dark:border-zinc-700"
                    style={{ width: columnWidths.action }}
                  >
                    <span className="sr-only">액션</span>
                  </th>
                  {headerGroup.headers.map(header => {
                    const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                    const alignClass =
                      meta?.align === 'right'
                        ? 'text-right'
                        : meta?.align === 'center'
                          ? 'text-center'
                          : 'text-left';
                    return (
                      <th
                        key={header.id}
                        className={`border-b border-r border-zinc-200 px-3 py-2 align-top dark:border-zinc-700 ${alignClass}`}
                        style={meta?.width ? { width: meta.width } : undefined}
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
              {/* Data rows */}
              {table.getRowModel().rows.length === 0 &&
              inputRows.every(r => r.status === 'empty') ? (
                <tr>
                  <td
                    colSpan={table.getVisibleLeafColumns().length + 1}
                    className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    조건에 맞는 거래가 없습니다.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
                  >
                    {/* Delete button cell */}
                    <td
                      className={`border-r border-zinc-200 px-2 ${rowPadding} text-center dark:border-zinc-700`}
                      style={{ width: columnWidths.action }}
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(row.original.id)}
                        disabled={isDeleting === row.original.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-rose-900/50 dark:hover:text-rose-400"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                    {row.getVisibleCells().map(cell => {
                      const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                      const alignClass =
                        meta?.align === 'right'
                          ? 'text-right'
                          : meta?.align === 'center'
                            ? 'text-center'
                            : 'text-left';
                      return (
                        <td
                          key={cell.id}
                          className={`border-r border-zinc-200 px-3 ${rowPadding} text-zinc-700 dark:border-zinc-700 dark:text-zinc-200 ${alignClass}`}
                          style={meta?.width ? { width: meta.width } : undefined}
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-200 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              건수{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                {filteredRows.length}
              </span>
              건
            </span>
            <span>
              수입{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatAmount(filteredSummary.income)}
              </span>
            </span>
            <span>
              지출{' '}
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {formatAmount(filteredSummary.expense)}
              </span>
            </span>
            <span>
              순액{' '}
              <span
                className={`font-semibold ${
                  {
                    positive: 'text-emerald-600 dark:text-emerald-400',
                    negative: 'text-rose-600 dark:text-rose-400',
                    neutral: 'text-zinc-700 dark:text-zinc-200',
                  }[netAmount > 0 ? 'positive' : netAmount < 0 ? 'negative' : 'neutral']
                }`}
              >
                {formatAmount(netAmount)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={event => table.setPageSize(Number(event.target.value))}
              className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {[10, 20, 50].map(size => (
                <option key={size} value={size}>
                  {size}개
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-zinc-200 px-2 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-zinc-200 px-2 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              다음
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-white text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
            <colgroup>
              <col style={{ width: columnWidths.action }} />
              <col style={{ width: columnWidths.date }} />
              <col style={{ width: columnWidths.category }} />
              <col style={{ width: columnWidths.type }} />
              <col style={{ width: columnWidths.paymentMethod }} />
              <col style={{ width: columnWidths.user }} />
              <col style={{ width: columnWidths.amount }} />
              <col style={{ width: columnWidths.description }} />
            </colgroup>
            <tbody>
              {/* Separator row with type toggle */}
              <tr className="border-b-2 border-dashed border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800">
                <td colSpan={table.getVisibleLeafColumns().length + 1} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      새 거래 입력:
                    </span>
                    <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
                      <button
                        type="button"
                        onClick={() => setInputTransactionType('expense')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          inputTransactionType === 'expense'
                            ? 'bg-rose-500 text-white'
                            : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                      >
                        지출
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputTransactionType('income')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          inputTransactionType === 'income'
                            ? 'bg-emerald-500 text-white'
                            : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                      >
                        수입
                      </button>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Input rows */}
              {inputRows.map((row, idx) => (
                <InputTableRow
                  key={row.id}
                  ref={(ref: InputTableRowRef | null) => {
                    if (ref) {
                      rowRefs.current.set(idx, ref);
                    } else {
                      rowRefs.current.delete(idx);
                    }
                  }}
                  row={row}
                  rowIndex={idx}
                  categoryGroups={inputCategoryGroups}
                  transactionType={inputTransactionType}
                  paymentMethods={paymentMethods}
                  users={users}
                  rowPadding={rowPadding}
                  onCellChange={handleCellChange}
                  onCellKeyDown={handleCellKeyDown}
                  onCellFocus={handleCellFocus}
                  onSave={handleSaveRow}
                  canSave={canSaveRow(idx)}
                  columnWidths={columnWidths}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  function renderColumnFilter(column: ReturnType<typeof table.getAllColumns>[number]) {
    const meta = column.columnDef.meta as ColumnMeta | undefined;
    if (!meta?.filter) return null;

    if (meta.filter === 'text') {
      return (
        <input
          className={baseInputClass}
          value={(column.getFilterValue() as string) ?? ''}
          onChange={event => column.setFilterValue(event.target.value || undefined)}
          placeholder={meta.placeholder ?? '검색'}
        />
      );
    }

    if (meta.filter === 'select') {
      if (meta.groupedOptions && meta.groupedOptions.length > 0) {
        return (
          <select
            className={baseInputClass}
            value={(column.getFilterValue() as string) ?? ''}
            onChange={event => column.setFilterValue(event.target.value || undefined)}
          >
            <option value="">전체</option>
            {meta.groupedOptions.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        );
      }

      return (
        <select
          className={baseInputClass}
          value={(column.getFilterValue() as string) ?? ''}
          onChange={event => column.setFilterValue(event.target.value || undefined)}
        >
          <option value="">전체</option>
          {meta.options?.map(option => (
            <option key={option} value={option}>
              {option === 'income' ? '수입' : option === 'expense' ? '지출' : option}
            </option>
          ))}
        </select>
      );
    }

    if (meta.filter === 'date') {
      const value = (column.getFilterValue() as DateFilter) ?? {};
      return (
        <input
          type="date"
          className={baseInputClass}
          value={value.date ?? ''}
          onChange={event => column.setFilterValue({ date: event.target.value || undefined })}
        />
      );
    }

    return null;
  }
}
