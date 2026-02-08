'use client';

import { useCallback, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type {
  HoldingTransactionInputRow,
  HoldingTransactionInputRowRef,
  CellPosition,
  RowStatus,
} from '@/components/features/asset-transaction/types';

const MIN_ROWS = 3;
const COLUMNS = [
  'date',
  'holdingId',
  'transactionType',
  'quantity',
  'priceOriginal',
  'priceKRW',
  'exchangeRate',
  'fees',
  'notes',
] as const;

function generateRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyRow(defaultDate: string): HoldingTransactionInputRow {
  return {
    id: generateRowId(),
    date: defaultDate,
    holdingId: '',
    transactionType: 'buy',
    quantity: '',
    priceOriginal: '',
    priceKRW: '',
    exchangeRate: '',
    fees: '',
    notes: '',
    status: 'empty',
  };
}

function isRowEmpty(row: HoldingTransactionInputRow, defaultDate: string): boolean {
  return (
    (row.date === defaultDate || row.date === '') &&
    row.holdingId === '' &&
    row.quantity === '' &&
    row.priceOriginal === '' &&
    row.priceKRW === '' &&
    row.exchangeRate === '' &&
    row.fees === '' &&
    row.notes === ''
  );
}

export interface UseHoldingTransactionInputRowsOptions {
  defaultDate: string;
  onSaved: () => void;
}

export interface UseHoldingTransactionInputRowsReturn {
  rows: HoldingTransactionInputRow[];
  currentPosition: CellPosition;
  handleCellChange: (rowIndex: number, field: string, value: string) => void;
  handleCellKeyDown: (rowIndex: number, colIndex: number, event: React.KeyboardEvent) => void;
  handleCellFocus: (rowIndex: number, colIndex: number) => void;
  handleSaveRow: (rowIndex: number) => Promise<void>;
  canSaveRow: (rowIndex: number) => boolean;
  rowRefs: React.MutableRefObject<Map<number, HoldingTransactionInputRowRef>>;
  resetRows: () => void;
}

export function useHoldingTransactionInputRows({
  defaultDate,
  onSaved,
}: UseHoldingTransactionInputRowsOptions): UseHoldingTransactionInputRowsReturn {
  const [rows, setRows] = useState<HoldingTransactionInputRow[]>(() =>
    Array.from({ length: MIN_ROWS }, () => createEmptyRow(defaultDate))
  );
  const [currentPosition, setCurrentPosition] = useState<CellPosition>({
    rowIndex: 0,
    colIndex: 0,
  });
  const rowRefs = useRef<Map<number, HoldingTransactionInputRowRef>>(new Map());

  const ensureMinRows = useCallback(
    (currentRows: HoldingTransactionInputRow[]): HoldingTransactionInputRow[] => {
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
      if (!row.holdingId) return false;
      if (!row.transactionType) return false;
      if (!row.date) return false;

      const quantity = parseFloat(row.quantity);
      if (isNaN(quantity) || quantity <= 0) return false;

      const priceKRW = parseFloat(row.priceKRW);
      if (isNaN(priceKRW) || priceKRW < 0) return false;

      return true;
    },
    [rows]
  );

  const handleSaveRow = useCallback(
    async (rowIndex: number) => {
      if (!canSaveRow(rowIndex)) return;

      const row = rows[rowIndex];

      setRows(prev => {
        const next = [...prev];
        next[rowIndex] = { ...next[rowIndex], status: 'saving' as RowStatus };
        return next;
      });

      try {
        await apiClient.asset.createTransaction({
          holdingId: row.holdingId,
          transactionType: row.transactionType,
          date: row.date,
          quantity: parseFloat(row.quantity),
          priceOriginal: parseFloat(row.priceOriginal) || 0,
          priceKRW: parseFloat(row.priceKRW),
          exchangeRate: row.exchangeRate ? parseFloat(row.exchangeRate) : null,
          fees: row.fees ? parseFloat(row.fees) : null,
          notes: row.notes || null,
        });

        setRows(prev => {
          const next = [...prev];
          next[rowIndex] = { ...next[rowIndex], status: 'saved' as RowStatus };
          return next;
        });

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
    [rows, canSaveRow, defaultDate, ensureMinRows, onSaved]
  );

  const moveFocus = useCallback(
    (newRowIndex: number, newColIndex: number) => {
      const clampedRow = Math.max(0, Math.min(newRowIndex, rows.length - 1));
      const clampedCol = Math.max(0, Math.min(newColIndex, COLUMNS.length - 1));

      setCurrentPosition({ rowIndex: clampedRow, colIndex: clampedCol });

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
            if (colIndex > 0) {
              moveFocus(rowIndex, colIndex - 1);
            } else if (rowIndex > 0) {
              moveFocus(rowIndex - 1, COLUMNS.length - 1);
            }
          } else {
            if (colIndex < COLUMNS.length - 1) {
              moveFocus(rowIndex, colIndex + 1);
            } else if (rowIndex < rows.length - 1) {
              moveFocus(rowIndex + 1, 0);
            }
          }
          break;

        case 'Enter':
          event.preventDefault();
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
