'use client';

import { memo, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { Input, Select } from '@/components/ui';
import type { CategoryGroup } from '@/types';
import type { TransactionRow as TransactionRowType, RowStatus } from './types';

const PAYMENT_METHODS = [
  { value: '현대카드', label: '현대카드' },
  { value: '신한카드', label: '신한카드' },
  { value: '계좌이체', label: '계좌이체' },
  { value: '현금', label: '현금' },
];

const FAMILY_MEMBERS = [
  { value: '지완', label: '지완' },
  { value: '지아', label: '지아' },
];

interface TransactionRowProps {
  row: TransactionRowType;
  rowIndex: number;
  categoryGroups: CategoryGroup[];
  onCellChange: (rowIndex: number, field: keyof TransactionRowType, value: string) => void;
  onCellKeyDown: (rowIndex: number, colIndex: number, event: KeyboardEvent) => void;
  onCellFocus: (rowIndex: number, colIndex: number) => void;
}

export interface TransactionRowRef {
  focusCell: (colIndex: number) => void;
}

const StatusIcon = ({ status }: { status: RowStatus }) => {
  switch (status) {
    case 'saved':
      return <span className="text-emerald-500">✓</span>;
    case 'saving':
      return <span className="animate-spin text-blue-500">⟳</span>;
    case 'error':
      return <span className="text-rose-500">!</span>;
    default:
      return null;
  }
};

const getRowBackgroundClass = (status: RowStatus): string => {
  switch (status) {
    case 'saved':
      return 'bg-emerald-50 dark:bg-emerald-950/30';
    case 'saving':
      return 'bg-blue-50 dark:bg-blue-950/30';
    case 'error':
      return 'bg-rose-50 dark:bg-rose-950/30';
    default:
      return '';
  }
};

export const TransactionRowComponent = memo(
  forwardRef<TransactionRowRef, TransactionRowProps>(
    ({ row, rowIndex, categoryGroups, onCellChange, onCellKeyDown, onCellFocus }, ref) => {
      const amountRef = useRef<HTMLInputElement>(null);
      const categoryRef = useRef<HTMLSelectElement>(null);
      const dateRef = useRef<HTMLInputElement>(null);
      const paymentRef = useRef<HTMLSelectElement>(null);
      const userRef = useRef<HTMLSelectElement>(null);
      const descriptionRef = useRef<HTMLInputElement>(null);

      const cellRefs = [amountRef, categoryRef, dateRef, paymentRef, userRef, descriptionRef];

      useImperativeHandle(ref, () => ({
        focusCell: (colIndex: number) => {
          cellRefs[colIndex]?.current?.focus();
        },
      }));

      // 대분류별로 그룹화된 옵션 생성
      const groupedCategoryOptions = useMemo(
        () =>
          categoryGroups.map(group => ({
            label: `${group.icon || ''} ${group.name}`.trim(),
            options:
              group.children?.map(child => ({
                value: child.id,
                label: `${child.icon || ''} ${child.name}`.trim(),
              })) || [],
          })),
        [categoryGroups]
      );

      const formattedAmount = useMemo(() => {
        if (!row.amount) return '';
        const numeric = Number(row.amount);
        if (Number.isNaN(numeric)) return '';
        return numeric.toLocaleString('ko-KR');
      }, [row.amount]);

      const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/[^\d]/g, '');
        onCellChange(rowIndex, 'amount', digits);
      };

      const createKeyDownHandler =
        (colIndex: number) => (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
          onCellKeyDown(rowIndex, colIndex, event);
        };

      const createFocusHandler = (colIndex: number) => () => {
        onCellFocus(rowIndex, colIndex);
      };

      const bgClass = getRowBackgroundClass(row.status);

      return (
        <div
          className={`grid grid-cols-7 border-b border-zinc-200 last:border-b-0 dark:border-zinc-700 ${bgClass}`}
        >
          <div className="border-r border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
            <Input
              ref={amountRef}
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formattedAmount}
              onChange={handleAmountChange}
              onKeyDown={createKeyDownHandler(0)}
              onFocus={createFocusHandler(0)}
              aria-label="금액"
              className="w-full border-0 bg-transparent px-2 py-1 text-right text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
            <Select
              ref={categoryRef}
              groupedOptions={groupedCategoryOptions}
              placeholder="선택"
              value={row.categoryId}
              onChange={e => onCellChange(rowIndex, 'categoryId', e.target.value)}
              onKeyDown={createKeyDownHandler(1)}
              onFocus={createFocusHandler(1)}
              aria-label="카테고리"
              className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
            <Input
              ref={dateRef}
              type="date"
              value={row.date}
              onChange={e => onCellChange(rowIndex, 'date', e.target.value)}
              onKeyDown={createKeyDownHandler(2)}
              onFocus={createFocusHandler(2)}
              aria-label="날짜"
              className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
            <Select
              ref={paymentRef}
              options={PAYMENT_METHODS}
              placeholder="선택"
              value={row.paymentMethod}
              onChange={e => onCellChange(rowIndex, 'paymentMethod', e.target.value)}
              onKeyDown={createKeyDownHandler(3)}
              onFocus={createFocusHandler(3)}
              aria-label="결제 수단"
              className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
            <Select
              ref={userRef}
              options={FAMILY_MEMBERS}
              placeholder="선택"
              value={row.user}
              onChange={e => onCellChange(rowIndex, 'user', e.target.value)}
              onKeyDown={createKeyDownHandler(4)}
              onFocus={createFocusHandler(4)}
              aria-label="사용자"
              className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
            <Input
              ref={descriptionRef}
              type="text"
              placeholder="메모"
              value={row.description}
              onChange={e => onCellChange(rowIndex, 'description', e.target.value)}
              onKeyDown={createKeyDownHandler(5)}
              onFocus={createFocusHandler(5)}
              aria-label="메모"
              className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-center px-2 py-1.5">
            <StatusIcon status={row.status} />
            {row.status === 'error' && row.errorMessage && (
              <span className="ml-1 text-xs text-rose-500" title={row.errorMessage}>
                오류
              </span>
            )}
          </div>
        </div>
      );
    }
  )
);

TransactionRowComponent.displayName = 'TransactionRowComponent';
