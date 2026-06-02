'use client';

import { X } from 'lucide-react';
import { SequentialTransactionForm } from './sequential-transaction-form';

interface TransactionInputPanelProps {
  open: boolean;
  year: number;
  month: number;
  onClose: () => void;
  onDataChange?: () => void | Promise<void>;
}

export function TransactionInputPanel({
  open,
  year,
  month,
  onClose,
  onDataChange,
}: TransactionInputPanelProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-stretch sm:justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-input-panel-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="거래 입력 닫기"
        onClick={onClose}
      />
      <section className="relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-lg bg-surface p-5 shadow-xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="transaction-input-panel-title" className="text-lg font-semibold text-ink">
              거래 입력
            </h2>
            <p className="mt-1 text-sm text-ink-subtle">
              {year}년 {month}월
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-soft hover:text-ink"
            aria-label="거래 입력 닫기"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <SequentialTransactionForm
          key={`${year}-${month}`}
          year={year}
          month={month}
          onDataChange={onDataChange}
        />
      </section>
    </div>
  );
}
