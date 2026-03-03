'use client';

import type { SequentialFormState, StepField } from './types';
import { STEP_FIELDS } from './types';

interface TransactionInputSummaryRowProps {
  formState: SequentialFormState;
  currentStep: number;
  persistedFields: Set<StepField>;
  getCategoryName: (id: string) => string;
  onFieldClick: (field: StepField) => void;
}

const EMPTY_LABELS: Record<StepField, string> = {
  user: '사용자 선택',
  type: '유형 선택',
  date: '날짜 선택',
  categoryId: '카테고리 선택',
  paymentMethod: '결제수단 선택',
  amount: '금액 입력',
  description: '메모 추가',
};

const FIELD_LABELS: Record<StepField, string> = {
  user: '사용자',
  type: '유형',
  date: '날짜',
  categoryId: '카테고리',
  paymentMethod: '결제수단',
  amount: '금액',
  description: '메모',
};

function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M9.828.722a.5.5 0 0 1 .354.146l5 5a.5.5 0 0 1 0 .707l-4.5 4.5a.5.5 0 0 1-.707 0 .5.5 0 0 1 0-.707L14.293 6 10 1.707 5.854 5.854a.5.5 0 0 1-.707-.707l4.5-4.5a.5.5 0 0 1 .354-.146zm-5.5 5.5a.5.5 0 0 1 .354.146l4.5 4.5a.5.5 0 0 1 0 .707l-1 1a.5.5 0 0 1-.707 0L6.5 11.707l-3 3H2.707l-.707-.707v-.793l3-3L4.293 9.5a.5.5 0 0 1 0-.707l1-1a.5.5 0 0 1 .354-.146z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function formatFieldValue(
  field: StepField,
  value: string,
  getCategoryName: (id: string) => string
): string {
  if (!value) return '';

  switch (field) {
    case 'type':
      return value === 'expense' ? '지출' : '수입';
    case 'categoryId':
      return getCategoryName(value);
    case 'amount': {
      const num = parseFloat(value.replace(/,/g, ''));
      return Number.isNaN(num) ? value : `${num.toLocaleString()}원`;
    }
    case 'date': {
      const [year, month, day] = value.split('-');
      if (!year || !month || !day) return value;
      return `${Number(month)}월 ${Number(day)}일`;
    }
    default:
      return value;
  }
}

function getDisplayValue(
  field: StepField,
  rawValue: string,
  currentStep: number,
  getCategoryName: (id: string) => string
) {
  const fieldStep = STEP_FIELDS.indexOf(field);
  const displayValue = formatFieldValue(field, rawValue, getCategoryName);
  const isActive = fieldStep === currentStep;

  if (displayValue) return displayValue;
  return isActive ? '입력 중...' : EMPTY_LABELS[field];
}

function SummaryFieldButton({
  field,
  formState,
  currentStep,
  persistedFields,
  getCategoryName,
  onFieldClick,
  className = '',
}: {
  field: StepField;
  formState: SequentialFormState;
  currentStep: number;
  persistedFields: Set<StepField>;
  getCategoryName: (id: string) => string;
  onFieldClick: (field: StepField) => void;
  className?: string;
}) {
  const fieldStep = STEP_FIELDS.indexOf(field);
  const rawValue = formState[field];
  const displayValue = formatFieldValue(field, rawValue, getCategoryName);
  const isActive = fieldStep === currentStep;
  const isVisited = fieldStep < currentStep || (isActive && rawValue !== '');
  const isFuture = fieldStep > currentStep;
  const isPersisted = persistedFields.has(field);

  let toneClass =
    'border-zinc-200/80 bg-white/70 text-zinc-500 hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-300';

  if (isActive) {
    toneClass =
      'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300';
  } else if (isVisited && displayValue) {
    toneClass =
      'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-300';
  } else if (isFuture) {
    toneClass =
      'border-zinc-200/60 bg-zinc-50/50 text-zinc-400 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-500 dark:hover:border-blue-800 dark:hover:bg-blue-950/20 dark:hover:text-blue-400';
  }

  const label = getDisplayValue(field, rawValue, currentStep, getCategoryName);
  const isAmount = field === 'amount';

  return (
    <button
      type="button"
      onClick={() => onFieldClick(field)}
      title={displayValue || EMPTY_LABELS[field]}
      className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${toneClass} ${className}`}
    >
      <span className="shrink-0 text-[11px] font-medium text-current/70">
        {FIELD_LABELS[field]}
      </span>
      <span
        className={`min-w-0 text-sm ${displayValue ? 'font-medium text-current' : 'font-normal text-current/75'} ${
          isAmount ? 'whitespace-nowrap' : 'truncate'
        }`}
      >
        {label}
      </span>
      {isPersisted && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          <PinIcon />
        </span>
      )}
    </button>
  );
}

export function TransactionInputSummaryRow({
  formState,
  currentStep,
  persistedFields,
  getCategoryName,
  onFieldClick,
}: TransactionInputSummaryRowProps) {
  return (
    <div className="rounded-xl border border-blue-100 bg-linear-to-r from-blue-50 to-white p-3 dark:border-blue-900/70 dark:from-blue-950/20 dark:to-zinc-950">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">입력 중인 거래</h3>
        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          현재: {FIELD_LABELS[STEP_FIELDS[currentStep]]}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid w-full grid-cols-3 gap-2">
          <SummaryFieldButton
            field="user"
            formState={formState}
            currentStep={currentStep}
            persistedFields={persistedFields}
            getCategoryName={getCategoryName}
            onFieldClick={onFieldClick}
            className="w-full"
          />
          <SummaryFieldButton
            field="type"
            formState={formState}
            currentStep={currentStep}
            persistedFields={persistedFields}
            getCategoryName={getCategoryName}
            onFieldClick={onFieldClick}
            className="w-full"
          />
          <SummaryFieldButton
            field="date"
            formState={formState}
            currentStep={currentStep}
            persistedFields={persistedFields}
            getCategoryName={getCategoryName}
            onFieldClick={onFieldClick}
            className="w-full"
          />
        </div>

        <div className="grid w-full grid-cols-3 gap-2">
          <SummaryFieldButton
            field="categoryId"
            formState={formState}
            currentStep={currentStep}
            persistedFields={persistedFields}
            getCategoryName={getCategoryName}
            onFieldClick={onFieldClick}
            className="w-full"
          />
          <SummaryFieldButton
            field="paymentMethod"
            formState={formState}
            currentStep={currentStep}
            persistedFields={persistedFields}
            getCategoryName={getCategoryName}
            onFieldClick={onFieldClick}
            className="w-full"
          />
          <SummaryFieldButton
            field="amount"
            formState={formState}
            currentStep={currentStep}
            persistedFields={persistedFields}
            getCategoryName={getCategoryName}
            onFieldClick={onFieldClick}
            className="w-full"
          />
        </div>

        <div className="flex w-full min-w-0 items-center gap-2">
          <SummaryFieldButton
            field="description"
            formState={formState}
            currentStep={currentStep}
            persistedFields={persistedFields}
            getCategoryName={getCategoryName}
            onFieldClick={onFieldClick}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
