'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui';
import type { TransactionType, CategoryGroup, TransactionFormData } from '@/types';
import { TransactionRowComponent, type TransactionRowRef } from './transaction-row';
import type { TransactionRow, CellPosition } from './types';
import { getTodayString } from '@/lib/date-utils';

const COLUMN_COUNT = 6;
const MIN_EMPTY_ROWS = 3;

interface MultiRowFormProps {
  defaultDate?: string;
  defaultUser?: string;
}

function generateRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyRow(defaultDate: string, defaultUser: string): TransactionRow {
  return {
    id: generateRowId(),
    amount: '',
    categoryId: '',
    date: defaultDate,
    paymentMethod: '',
    user: defaultUser,
    description: '',
    status: 'empty',
  };
}

function isRowEmpty(row: TransactionRow): boolean {
  return !row.amount && !row.categoryId && !row.paymentMethod && !row.description;
}

function canSaveRow(row: TransactionRow): boolean {
  return !!row.amount && !!row.categoryId;
}

export function MultiRowForm({ defaultDate, defaultUser = '' }: MultiRowFormProps) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [currentUser, setCurrentUser] = useState(defaultUser);

  const today = defaultDate || getTodayString();

  const [rows, setRows] = useState<TransactionRow[]>(() =>
    Array.from({ length: MIN_EMPTY_ROWS }, () => createEmptyRow(today, currentUser))
  );

  const [currentPosition, setCurrentPosition] = useState<CellPosition>({
    rowIndex: 0,
    colIndex: 0,
  });
  const rowRefs = useRef<Map<number, TransactionRowRef>>(new Map());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?type=${type}&grouped=true`);
        const result = await response.json();
        if (result.success) {
          setCategoryGroups(result.data);
          setRows(prev => prev.map(row => (row.categoryId ? { ...row, categoryId: '' } : row)));
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, [type]);

  const handleTypeChange = (newType: string) => {
    setType(newType as TransactionType);
  };

  const saveRow = useCallback(
    async (rowIndex: number) => {
      const row = rows[rowIndex];
      if (!row || row.status === 'saving' || row.status === 'saved' || !canSaveRow(row)) {
        return;
      }

      setRows(prev => prev.map((r, i) => (i === rowIndex ? { ...r, status: 'saving' } : r)));

      try {
        const formData: TransactionFormData = {
          type,
          amount: parseFloat(row.amount),
          categoryId: row.categoryId,
          date: row.date,
          paymentMethod: row.paymentMethod || undefined,
          user: row.user || undefined,
          description: row.description || undefined,
        };

        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success) {
          setRows(prev => prev.map((r, i) => (i === rowIndex ? { ...r, status: 'saved' } : r)));
          if (row.user) {
            setCurrentUser(row.user);
          }
          router.refresh();
        } else {
          setRows(prev =>
            prev.map((r, i) =>
              i === rowIndex
                ? { ...r, status: 'error', errorMessage: result.error || '저장 실패' }
                : r
            )
          );
        }
      } catch (err) {
        console.error('Failed to save transaction:', err);
        setRows(prev =>
          prev.map((r, i) =>
            i === rowIndex ? { ...r, status: 'error', errorMessage: '저장 중 오류 발생' } : r
          )
        );
      }
    },
    [rows, type, router]
  );

  const ensureMinEmptyRows = useCallback(() => {
    setRows(prev => {
      const emptyCount = prev.filter(r => isRowEmpty(r) && r.status === 'empty').length;
      if (emptyCount < MIN_EMPTY_ROWS) {
        const newRows = Array.from({ length: MIN_EMPTY_ROWS - emptyCount }, () =>
          createEmptyRow(today, currentUser)
        );
        return [...prev, ...newRows];
      }
      return prev;
    });
  }, [today, currentUser]);

  const handleCellChange = useCallback(
    (rowIndex: number, field: keyof TransactionRow, value: string) => {
      setRows(prev =>
        prev.map((row, i) => {
          if (i !== rowIndex) return row;
          const updated = { ...row, [field]: value };
          if (row.status === 'empty' || row.status === 'saved') {
            updated.status = 'editing';
          }
          if (row.status === 'error') {
            updated.status = 'editing';
            updated.errorMessage = undefined;
          }
          return updated;
        })
      );
      ensureMinEmptyRows();
    },
    [ensureMinEmptyRows]
  );

  const focusCell = useCallback((rowIndex: number, colIndex: number) => {
    const rowRef = rowRefs.current.get(rowIndex);
    if (rowRef) {
      rowRef.focusCell(colIndex);
    }
  }, []);

  const moveToCell = useCallback(
    (rowIndex: number, colIndex: number, saveCurrentRow: boolean = false) => {
      if (saveCurrentRow && canSaveRow(rows[currentPosition.rowIndex])) {
        const currentRow = rows[currentPosition.rowIndex];
        if (currentRow.status === 'editing') {
          saveRow(currentPosition.rowIndex);
        }
      }

      const maxRow = rows.length - 1;
      const targetRow = Math.max(0, Math.min(rowIndex, maxRow));
      const targetCol = Math.max(0, Math.min(colIndex, COLUMN_COUNT - 1));

      setCurrentPosition({ rowIndex: targetRow, colIndex: targetCol });
      setTimeout(() => focusCell(targetRow, targetCol), 0);
    },
    [rows, currentPosition, saveRow, focusCell]
  );

  const handleCellKeyDown = useCallback(
    (rowIndex: number, colIndex: number, event: KeyboardEvent) => {
      const { key, shiftKey } = event;

      if (key === 'Tab') {
        event.preventDefault();
        if (shiftKey) {
          if (colIndex > 0) {
            moveToCell(rowIndex, colIndex - 1);
          } else if (rowIndex > 0) {
            moveToCell(rowIndex - 1, COLUMN_COUNT - 1);
          }
        } else {
          if (colIndex < COLUMN_COUNT - 1) {
            moveToCell(rowIndex, colIndex + 1);
          } else {
            moveToCell(rowIndex + 1, 0, true);
          }
        }
        return;
      }

      if (key === 'Enter' && !(event.nativeEvent as globalThis.KeyboardEvent).isComposing) {
        event.preventDefault();
        moveToCell(rowIndex + 1, colIndex, true);
        return;
      }

      if (key === 'ArrowUp' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (rowIndex > 0) {
          moveToCell(rowIndex - 1, colIndex);
        }
        return;
      }

      if (key === 'ArrowDown' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (rowIndex < rows.length - 1) {
          moveToCell(rowIndex + 1, colIndex);
        }
        return;
      }

      if (key === 'ArrowLeft' && !event.altKey && !event.ctrlKey && !event.metaKey && !shiftKey) {
        event.preventDefault();
        if (colIndex > 0) {
          moveToCell(rowIndex, colIndex - 1);
        }
        return;
      }

      if (key === 'ArrowRight' && !event.altKey && !event.ctrlKey && !event.metaKey && !shiftKey) {
        event.preventDefault();
        if (colIndex < COLUMN_COUNT - 1) {
          moveToCell(rowIndex, colIndex + 1);
        }
        return;
      }
    },
    [moveToCell, rows.length]
  );

  const handleCellFocus = useCallback((rowIndex: number, colIndex: number) => {
    setCurrentPosition({ rowIndex, colIndex });
  }, []);

  const setRowRef = useCallback((index: number, ref: TransactionRowRef | null) => {
    if (ref) {
      rowRefs.current.set(index, ref);
    } else {
      rowRefs.current.delete(index);
    }
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="expense" onChange={handleTypeChange}>
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">
            지출
          </TabsTrigger>
          <TabsTrigger value="income" className="flex-1">
            수입
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <div className="border-r border-zinc-200 px-3 py-2 dark:border-zinc-700">금액</div>
          <div className="border-r border-zinc-200 px-3 py-2 dark:border-zinc-700">카테고리</div>
          <div className="border-r border-zinc-200 px-3 py-2 dark:border-zinc-700">날짜</div>
          <div className="border-r border-zinc-200 px-3 py-2 dark:border-zinc-700">결제 수단</div>
          <div className="border-r border-zinc-200 px-3 py-2 dark:border-zinc-700">사용자</div>
          <div className="border-r border-zinc-200 px-3 py-2 dark:border-zinc-700">메모</div>
          <div className="px-3 py-2 text-center">상태</div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {rows.map((row, index) => (
            <TransactionRowComponent
              key={row.id}
              ref={ref => setRowRef(index, ref)}
              row={row}
              rowIndex={index}
              categoryGroups={categoryGroups}
              onCellChange={handleCellChange}
              onCellKeyDown={handleCellKeyDown}
              onCellFocus={handleCellFocus}
            />
          ))}
        </div>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        <p>
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 dark:border-zinc-600 dark:bg-zinc-700">
            Tab
          </kbd>{' '}
          다음 셀 /{' '}
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 dark:border-zinc-600 dark:bg-zinc-700">
            Enter
          </kbd>{' '}
          다음 행 + 자동 저장 /{' '}
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 dark:border-zinc-600 dark:bg-zinc-700">
            방향키
          </kbd>{' '}
          셀 이동
        </p>
      </div>
    </div>
  );
}
