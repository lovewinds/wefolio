'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import type { CategoryGroup, TransactionType } from '@/types';
import type { InputRow, InputTableRowRef } from './types';

const baseInputClass =
  'h-7 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400';

interface InputTableRowProps {
  row: InputRow;
  rowIndex: number;
  categoryGroups: CategoryGroup[];
  transactionType: TransactionType;
  paymentMethods: string[];
  users: string[];
  rowPadding: string;
  onCellChange: (rowIndex: number, field: string, value: string) => void;
  onCellKeyDown: (rowIndex: number, colIndex: number, event: React.KeyboardEvent) => void;
  onCellFocus: (rowIndex: number, colIndex: number) => void;
  onSave: (rowIndex: number) => void;
  canSave: boolean;
}

export const InputTableRow = forwardRef<InputTableRowRef, InputTableRowProps>(
  (
    {
      row,
      rowIndex,
      categoryGroups,
      transactionType,
      paymentMethods,
      users,
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
    const categoryRef = useRef<HTMLSelectElement>(null);
    const paymentMethodRef = useRef<HTMLSelectElement>(null);
    const userRef = useRef<HTMLSelectElement>(null);
    const descriptionRef = useRef<HTMLInputElement>(null);
    const amountRef = useRef<HTMLInputElement>(null);

    const cellRefs = [dateRef, categoryRef, paymentMethodRef, userRef, descriptionRef, amountRef];

    useImperativeHandle(ref, () => ({
      focusCell: (colIndex: number) => {
        const cellRef = cellRefs[colIndex];
        if (cellRef?.current) {
          cellRef.current.focus();
        }
      },
    }));

    // Filter category groups by transaction type
    const filteredCategoryGroups = categoryGroups.filter(group => {
      // Check if any child has the matching type by looking at the group's children
      return group.children && group.children.length > 0;
    });

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
          title={canSave ? '저장' : '금액과 카테고리를 입력하세요'}
        >
          <Save size={14} />
        </button>
      );
    };

    return (
      <tr className={`border-b border-zinc-200 dark:border-zinc-700 ${getRowBgClass()}`}>
        {/* Action column - Save button */}
        <td
          className={`border-r border-zinc-200 px-2 ${rowPadding} text-center dark:border-zinc-700`}
        >
          {renderSaveButton()}
        </td>

        {/* Date */}
        <td className={`border-r border-zinc-200 px-2 ${rowPadding} dark:border-zinc-700`}>
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

        {/* Category */}
        <td className={`border-r border-zinc-200 px-2 ${rowPadding} dark:border-zinc-700`}>
          <select
            ref={categoryRef}
            value={row.categoryId}
            onChange={e => onCellChange(rowIndex, 'categoryId', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 1, e)}
            onFocus={() => onCellFocus(rowIndex, 1)}
            className={baseInputClass}
          >
            <option value="">선택</option>
            {filteredCategoryGroups.map(group => (
              <optgroup key={group.id} label={`${group.icon || ''} ${group.name}`.trim()}>
                {group.children?.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.icon ? `${child.icon} ` : ''}
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </td>

        {/* Type - readonly display */}
        <td
          className={`border-r border-zinc-200 px-2 ${rowPadding} text-zinc-500 dark:border-zinc-700 dark:text-zinc-400`}
        >
          <span className="text-xs">{transactionType === 'income' ? '수입' : '지출'}</span>
        </td>

        {/* Payment Method */}
        <td className={`border-r border-zinc-200 px-2 ${rowPadding} dark:border-zinc-700`}>
          <select
            ref={paymentMethodRef}
            value={row.paymentMethod}
            onChange={e => onCellChange(rowIndex, 'paymentMethod', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 2, e)}
            onFocus={() => onCellFocus(rowIndex, 2)}
            className={baseInputClass}
          >
            <option value="">선택</option>
            {paymentMethods.map(method => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </td>

        {/* User */}
        <td className={`border-r border-zinc-200 px-2 ${rowPadding} dark:border-zinc-700`}>
          <select
            ref={userRef}
            value={row.user}
            onChange={e => onCellChange(rowIndex, 'user', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 3, e)}
            onFocus={() => onCellFocus(rowIndex, 3)}
            className={baseInputClass}
          >
            <option value="">선택</option>
            {users.map(user => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </td>

        {/* Description */}
        <td className={`border-r border-zinc-200 px-2 ${rowPadding} dark:border-zinc-700`}>
          <input
            ref={descriptionRef}
            type="text"
            value={row.description}
            onChange={e => onCellChange(rowIndex, 'description', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 4, e)}
            onFocus={() => onCellFocus(rowIndex, 4)}
            placeholder="메모"
            className={baseInputClass}
          />
        </td>

        {/* Amount */}
        <td className={`px-2 ${rowPadding}`}>
          <input
            ref={amountRef}
            type="number"
            value={row.amount}
            onChange={e => onCellChange(rowIndex, 'amount', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 5, e)}
            onFocus={() => onCellFocus(rowIndex, 5)}
            placeholder="금액"
            className={`${baseInputClass} text-right`}
            min="0"
            step="100"
          />
        </td>
      </tr>
    );
  }
);

InputTableRow.displayName = 'InputTableRow';
