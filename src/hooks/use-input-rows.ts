'use client';

import { useCallback, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { TransactionType } from '@/types';
import type {
  InputRow,
  InputTableRowRef,
  CellPosition,
  RowStatus,
} from '@/components/features/transaction/types';

const MIN_ROWS = 3;
const COLUMNS = ['date', 'categoryId', 'paymentMethod', 'user', 'description', 'amount'] as const;

function generateRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyRow(defaultDate: string): InputRow {
  return {
    id: generateRowId(),
    date: defaultDate,
    categoryId: '',
    paymentMethod: '',
    user: '',
    description: '',
    amount: '',
    status: 'empty',
  };
}

function isRowEmpty(row: InputRow, defaultDate: string): boolean {
  return (
    (row.date === defaultDate || row.date === '') &&
    row.categoryId === '' &&
    row.paymentMethod === '' &&
    row.user === '' &&
    row.description === '' &&
    row.amount === ''
  );
}

export interface UseInputRowsOptions {
  defaultDate: string;
  transactionType: TransactionType;
  onSaved: () => void;
}

export interface UseInputRowsReturn {
  rows: InputRow[];
  currentPosition: CellPosition;
  handleCellChange: (rowIndex: number, field: string, value: string) => void;
  handleCellKeyDown: (rowIndex: number, colIndex: number, event: React.KeyboardEvent) => void;
  handleCellFocus: (rowIndex: number, colIndex: number) => void;
  handleSaveRow: (rowIndex: number) => Promise<void>;
  canSaveRow: (rowIndex: number) => boolean;
  rowRefs: React.MutableRefObject<Map<number, InputTableRowRef>>;
  resetRows: () => void;
}

export function useInputRows({
  defaultDate,
  transactionType,
  onSaved,
}: UseInputRowsOptions): UseInputRowsReturn {
  const [rows, setRows] = useState<InputRow[]>(() =>
    Array.from({ length: MIN_ROWS }, () => createEmptyRow(defaultDate))
  );
  const [currentPosition, setCurrentPosition] = useState<CellPosition>({
    rowIndex: 0,
    colIndex: 0,
  });
  const rowRefs = useRef<Map<number, InputTableRowRef>>(new Map());

  const ensureMinRows = useCallback(
    (currentRows: InputRow[]): InputRow[] => {
      const emptyCount = currentRows.filter(r => isRowEmpty(r, defaultDate)).length;
      if (emptyCount < MIN_ROWS) {
        const toAdd = MIN_ROWS - emptyCount;
        return [
          ...currentRows,
          ...Array.from({ length: toAdd }, () => createEmptyRow(defaultDate)),
        ];
      }
      return currentRows;
    },
    [defaultDate]
  );

  const handleCellChange = useCallback(
    (rowIndex: number, field: string, value: string) => {
      setRows(prev => {
        const next = [...prev];
        const row = { ...next[rowIndex] };
        (row as Record<string, string>)[field] = value;

        // Update status
        if (isRowEmpty(row, defaultDate)) {
          row.status = 'empty';
        } else if (row.status === 'empty' || row.status === 'saved') {
          row.status = 'editing';
        }

        next[rowIndex] = row;
        return ensureMinRows(next);
      });
    },
    [defaultDate, ensureMinRows]
  );

  const canSaveRow = useCallback(
    (rowIndex: number): boolean => {
      const row = rows[rowIndex];
      if (!row) return false;
      if (row.status === 'saving') return false;

      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount <= 0) return false;
      if (!row.categoryId) return false;
      if (!row.date) return false;

      return true;
    },
    [rows]
  );

  const handleSaveRow = useCallback(
    async (rowIndex: number) => {
      if (!canSaveRow(rowIndex)) return;

      const row = rows[rowIndex];

      // Set status to saving
      setRows(prev => {
        const next = [...prev];
        next[rowIndex] = { ...next[rowIndex], status: 'saving' as RowStatus };
        return next;
      });

      try {
        await apiClient.transactions.create({
          type: transactionType,
          amount: parseFloat(row.amount),
          categoryId: row.categoryId,
          date: row.date,
          paymentMethod: row.paymentMethod || null,
          user: row.user || null,
          description: row.description || null,
        });

        // Set status to saved, then reset the row after a brief delay
        setRows(prev => {
          const next = [...prev];
          next[rowIndex] = { ...next[rowIndex], status: 'saved' as RowStatus };
          return next;
        });

        // Reset the row after showing saved status
        setTimeout(() => {
          setRows(prev => {
            const next = [...prev];
            next[rowIndex] = createEmptyRow(defaultDate);
            return ensureMinRows(next);
          });
        }, 500);

        onSaved();
      } catch (error) {
        console.error('Save error:', error);
        setRows(prev => {
          const next = [...prev];
          next[rowIndex] = {
            ...next[rowIndex],
            status: 'error' as RowStatus,
            errorMessage: error instanceof Error ? error.message : 'Failed to save',
          };
          return next;
        });
      }
    },
    [rows, canSaveRow, transactionType, defaultDate, ensureMinRows, onSaved]
  );

  const moveFocus = useCallback(
    (newRowIndex: number, newColIndex: number) => {
      // Clamp values
      const clampedRow = Math.max(0, Math.min(newRowIndex, rows.length - 1));
      const clampedCol = Math.max(0, Math.min(newColIndex, COLUMNS.length - 1));

      setCurrentPosition({ rowIndex: clampedRow, colIndex: clampedCol });

      // Focus the cell
      const rowRef = rowRefs.current.get(clampedRow);
      if (rowRef) {
        rowRef.focusCell(clampedCol);
      }
    },
    [rows.length]
  );

  const handleCellKeyDown = useCallback(
    (rowIndex: number, colIndex: number, event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            // Shift+Tab: previous cell
            if (colIndex > 0) {
              moveFocus(rowIndex, colIndex - 1);
            } else if (rowIndex > 0) {
              moveFocus(rowIndex - 1, COLUMNS.length - 1);
            }
          } else {
            // Tab: next cell
            if (colIndex < COLUMNS.length - 1) {
              moveFocus(rowIndex, colIndex + 1);
            } else if (rowIndex < rows.length - 1) {
              moveFocus(rowIndex + 1, 0);
            }
          }
          break;

        case 'Enter':
          event.preventDefault();
          // Move to next row, same column
          if (rowIndex < rows.length - 1) {
            moveFocus(rowIndex + 1, colIndex);
          }
          break;

        case 'ArrowUp':
          if (rowIndex > 0) {
            event.preventDefault();
            moveFocus(rowIndex - 1, colIndex);
          }
          break;

        case 'ArrowDown':
          if (rowIndex < rows.length - 1) {
            event.preventDefault();
            moveFocus(rowIndex + 1, colIndex);
          }
          break;

        case 'ArrowLeft':
          // Only move if at start of input
          if (
            event.currentTarget instanceof HTMLInputElement &&
            event.currentTarget.selectionStart === 0 &&
            colIndex > 0
          ) {
            event.preventDefault();
            moveFocus(rowIndex, colIndex - 1);
          }
          break;

        case 'ArrowRight':
          // Only move if at end of input
          if (
            event.currentTarget instanceof HTMLInputElement &&
            event.currentTarget.selectionEnd === event.currentTarget.value.length &&
            colIndex < COLUMNS.length - 1
          ) {
            event.preventDefault();
            moveFocus(rowIndex, colIndex + 1);
          }
          break;
      }
    },
    [rows.length, moveFocus]
  );

  const handleCellFocus = useCallback((rowIndex: number, colIndex: number) => {
    setCurrentPosition({ rowIndex, colIndex });
  }, []);

  const resetRows = useCallback(() => {
    setRows(Array.from({ length: MIN_ROWS }, () => createEmptyRow(defaultDate)));
    setCurrentPosition({ rowIndex: 0, colIndex: 0 });
    rowRefs.current.clear();
  }, [defaultDate]);

  return {
    rows,
    currentPosition,
    handleCellChange,
    handleCellKeyDown,
    handleCellFocus,
    handleSaveRow,
    canSaveRow,
    rowRefs,
    resetRows,
  };
}
