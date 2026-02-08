'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import { HOLDING_TRANSACTION_TYPE_OPTIONS } from '@/lib/constants';
import { formatAmount } from '@/lib/format-utils';
import type {
  HoldingTransactionInputRow,
  HoldingTransactionInputRowRef,
  HoldingOption,
} from './types';

const baseInputClass =
  'h-7 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400';

interface HoldingTransactionInputRowProps {
  row: HoldingTransactionInputRow;
  rowIndex: number;
  holdings: HoldingOption[];
  rowPadding: string;
  onCellChange: (rowIndex: number, field: string, value: string) => void;
  onCellKeyDown: (rowIndex: number, colIndex: number, event: React.KeyboardEvent) => void;
  onCellFocus: (rowIndex: number, colIndex: number) => void;
  onSave: (rowIndex: number) => void;
  canSave: boolean;
}

export const HoldingTransactionInputRowComponent = forwardRef<
  HoldingTransactionInputRowRef,
  HoldingTransactionInputRowProps
>(
  (
    {
      row,
      rowIndex,
      holdings,
      rowPadding,
      onCellChange,
      onCellKeyDown,
      onCellFocus,
      onSave,
      canSave,
    },
    ref
  ) => {
    const dateRef = useRef<HTMLInputElement>(null);
    const holdingRef = useRef<HTMLSelectElement>(null);
    const typeRef = useRef<HTMLSelectElement>(null);
    const quantityRef = useRef<HTMLInputElement>(null);
    const priceOriginalRef = useRef<HTMLInputElement>(null);
    const priceKRWRef = useRef<HTMLInputElement>(null);
    const exchangeRateRef = useRef<HTMLInputElement>(null);
    const feesRef = useRef<HTMLInputElement>(null);
    const notesRef = useRef<HTMLInputElement>(null);

    const cellRefs = [
      dateRef,
      holdingRef,
      typeRef,
      quantityRef,
      priceOriginalRef,
      priceKRWRef,
      exchangeRateRef,
      feesRef,
      notesRef,
    ];

    useImperativeHandle(ref, () => ({
      focusCell: (colIndex: number) => {
        const cellRef = cellRefs[colIndex];
        if (cellRef?.current) {
          cellRef.current.focus();
        }
      },
    }));

    const getRowBgClass = () => {
      switch (row.status) {
        case 'saving':
          return 'bg-blue-50/50 dark:bg-blue-900/20';
        case 'saved':
          return 'bg-emerald-50/50 dark:bg-emerald-900/20';
        case 'error':
          return 'bg-rose-50/50 dark:bg-rose-900/20';
        case 'editing':
          return 'bg-amber-50/30 dark:bg-amber-900/10';
        default:
          return 'bg-zinc-50/50 dark:bg-zinc-800/30';
      }
    };

    const renderSaveButton = () => {
      if (row.status === 'saving') {
        return (
          <span className="inline-flex h-7 w-7 items-center justify-center text-blue-500">
            <Loader2 size={14} className="animate-spin" />
          </span>
        );
      }
      if (row.status === 'saved') {
        return (
          <span className="inline-flex h-7 w-7 items-center justify-center text-emerald-500">
            <Check size={14} />
          </span>
        );
      }
      return (
        <button
          type="button"
          onClick={() => onSave(rowIndex)}
          disabled={!canSave}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            canSave
              ? 'text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50'
              : 'text-zinc-300 dark:text-zinc-600'
          }`}
          title={canSave ? '저장' : '종목, 수량, 원화가격을 입력하세요'}
        >
          <Save size={14} />
        </button>
      );
    };

    const td = `border-r border-zinc-200 px-2 ${rowPadding} dark:border-zinc-700`;

    return (
      <tr className={`border-b border-zinc-200 dark:border-zinc-700 ${getRowBgClass()}`}>
        {/* Save button */}
        <td
          className={`border-r border-zinc-200 px-2 ${rowPadding} text-center dark:border-zinc-700`}
        >
          {renderSaveButton()}
        </td>

        {/* Date */}
        <td className={td}>
          <input
            ref={dateRef}
            type="date"
            value={row.date}
            onChange={e => onCellChange(rowIndex, 'date', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 0, e)}
            onFocus={() => onCellFocus(rowIndex, 0)}
            className={baseInputClass}
          />
        </td>

        {/* Holding (종목) — spans asset+account+member columns */}
        <td className={td} colSpan={3}>
          <select
            ref={holdingRef}
            value={row.holdingId}
            onChange={e => onCellChange(rowIndex, 'holdingId', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 1, e)}
            onFocus={() => onCellFocus(rowIndex, 1)}
            className={baseInputClass}
          >
            <option value="">선택</option>
            {holdings.map(h => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </td>

        {/* Transaction Type */}
        <td className={td}>
          <select
            ref={typeRef}
            value={row.transactionType}
            onChange={e => onCellChange(rowIndex, 'transactionType', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 2, e)}
            onFocus={() => onCellFocus(rowIndex, 2)}
            className={baseInputClass}
          >
            {HOLDING_TRANSACTION_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </td>

        {/* Quantity */}
        <td className={td}>
          <input
            ref={quantityRef}
            type="number"
            value={row.quantity}
            onChange={e => onCellChange(rowIndex, 'quantity', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 3, e)}
            onFocus={() => onCellFocus(rowIndex, 3)}
            placeholder="수량"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Price Original */}
        <td className={td}>
          <input
            ref={priceOriginalRef}
            type="number"
            value={row.priceOriginal}
            onChange={e => onCellChange(rowIndex, 'priceOriginal', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 4, e)}
            onFocus={() => onCellFocus(rowIndex, 4)}
            placeholder="원가"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Price KRW */}
        <td className={td}>
          <input
            ref={priceKRWRef}
            type="number"
            value={row.priceKRW}
            onChange={e => onCellChange(rowIndex, 'priceKRW', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 5, e)}
            onFocus={() => onCellFocus(rowIndex, 5)}
            placeholder="원화가격"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Exchange Rate */}
        <td className={td}>
          <input
            ref={exchangeRateRef}
            type="number"
            value={row.exchangeRate}
            onChange={e => onCellChange(rowIndex, 'exchangeRate', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 6, e)}
            onFocus={() => onCellFocus(rowIndex, 6)}
            placeholder="환율"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Total KRW (auto-calculated) */}
        <td
          className={`border-r border-zinc-200 px-2 ${rowPadding} text-right text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400`}
        >
          {(() => {
            const q = parseFloat(row.quantity);
            const p = parseFloat(row.priceKRW);
            if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
              return formatAmount(q * p);
            }
            return '-';
          })()}
        </td>

        {/* Fees */}
        <td className={td}>
          <input
            ref={feesRef}
            type="number"
            value={row.fees}
            onChange={e => onCellChange(rowIndex, 'fees', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 7, e)}
            onFocus={() => onCellFocus(rowIndex, 7)}
            placeholder="수수료"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Notes */}
        <td className={`px-2 ${rowPadding}`}>
          <input
            ref={notesRef}
            type="text"
            value={row.notes}
            onChange={e => onCellChange(rowIndex, 'notes', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 8, e)}
            onFocus={() => onCellFocus(rowIndex, 8)}
            placeholder="메모"
            className={baseInputClass}
          />
        </td>
      </tr>
    );
  }
);

HoldingTransactionInputRowComponent.displayName = 'HoldingTransactionInputRow';
