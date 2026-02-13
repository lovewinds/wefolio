'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { TransactionType, CategoryGroup } from '@/types';
import type { ComboboxHandle, ComboboxOption, ComboboxOptionGroup } from '@/components/ui/combobox';
import { Combobox } from '@/components/ui';
import type { SequentialFormState, StepField, FormOptions } from './types';
import { STEP_FIELDS, STEP_LABELS, OPTIONAL_STEPS } from './types';

interface ActiveFieldInputProps {
  formState: SequentialFormState;
  currentStep: number;
  options: FormOptions;
  onFieldChange: (field: StepField, value: string) => void;
  onAdvance: () => void;
  onSkip: () => void;
  onSave: () => void;
  canSave: boolean;
}

function buildCategoryGroupedOptions(categories: CategoryGroup[]): ComboboxOptionGroup[] {
  return categories
    .filter(group => {
      const children = group.children ?? [];
      return children.length > 0 ? children.some(() => true) : true;
    })
    .map(group => ({
      label: `${group.icon ?? ''} ${group.name}`.trim(),
      options:
        group.children && group.children.length > 0
          ? group.children.map(child => ({
              value: child.id,
              label: child.name,
              icon: child.icon ?? undefined,
              sublabel: group.name,
            }))
          : [
              {
                value: group.id,
                label: group.name,
                icon: group.icon ?? undefined,
              },
            ],
    }));
}

function buildSimpleOptions(items: string[]): ComboboxOption[] {
  return items.map(item => ({ value: item, label: item }));
}

export function ActiveFieldInput({
  formState,
  currentStep,
  options,
  onFieldChange,
  onAdvance,
  onSkip,
  onSave,
  canSave,
}: ActiveFieldInputProps) {
  const field = STEP_FIELDS[currentStep];
  if (!field) return null;

  const isOptional = OPTIONAL_STEPS.has(field);
  const isLastStep = currentStep === STEP_FIELDS.length - 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <label className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
        {STEP_LABELS[field]}
        {isOptional && (
          <span className="ml-2 text-sm font-normal text-zinc-400 dark:text-zinc-500">(선택)</span>
        )}
      </label>

      <div className="w-full max-w-md">
        <FieldInput
          field={field}
          value={formState[field]}
          selectedUser={formState.user}
          options={options}
          onChange={value => onFieldChange(field, value)}
          onConfirm={isLastStep && canSave ? onSave : onAdvance}
        />
      </div>

      <div className="flex items-center gap-3">
        {isOptional && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            건너뛰기
          </button>
        )}
        {isLastStep && canSave && (
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            저장
          </button>
        )}
      </div>
    </div>
  );
}

interface FieldInputProps {
  field: StepField;
  value: string;
  selectedUser: string;
  options: FormOptions;
  onChange: (value: string) => void;
  onConfirm: () => void;
}

function FieldInput({ field, value, selectedUser, options, onChange, onConfirm }: FieldInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const comboRef = useRef<ComboboxHandle>(null);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (field === 'user' || field === 'categoryId' || field === 'paymentMethod') {
        comboRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [field]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onConfirm();
      }
    },
    [onConfirm]
  );

  switch (field) {
    case 'user':
      return (
        <Combobox
          ref={comboRef}
          options={buildSimpleOptions(options.users)}
          value={value}
          onChange={onChange}
          onConfirm={onConfirm}
          placeholder="사용자 이름 입력..."
          autoFocus
        />
      );

    case 'type':
      return (
        <TypeToggle
          ref={inputRef}
          value={value as TransactionType}
          onChange={onChange}
          onConfirm={onConfirm}
        />
      );

    case 'date':
      return (
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-lg text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
        />
      );

    case 'categoryId': {
      const grouped = buildCategoryGroupedOptions(options.categories);
      return (
        <Combobox
          ref={comboRef}
          groupedOptions={grouped}
          value={value}
          onChange={onChange}
          onConfirm={onConfirm}
          placeholder="카테고리 검색... (초성 검색 가능)"
          autoFocus
        />
      );
    }

    case 'paymentMethod': {
      const userKey = selectedUser.trim();
      const userMethods = userKey ? (options.paymentMethodsByUser?.[userKey] ?? []) : [];
      const availableMethods = userMethods.length > 0 ? userMethods : options.paymentMethods;
      const paymentMethodOptions = buildSimpleOptions(
        Array.from(new Set(availableMethods)).sort((a, b) => a.localeCompare(b, 'ko'))
      );

      return (
        <Combobox
          ref={comboRef}
          options={paymentMethodOptions}
          value={value}
          onChange={onChange}
          onConfirm={onConfirm}
          placeholder="결제수단 입력..."
          autoFocus
        />
      );
    }

    case 'amount':
      return (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              onChange(raw);
            }}
            onKeyDown={handleKeyDown}
            placeholder="금액 입력..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 pr-10 text-lg text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
            원
          </span>
        </div>
      );

    case 'description':
      return (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메모 입력..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-lg text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
        />
      );

    default:
      return null;
  }
}

interface TypeToggleProps {
  value: TransactionType;
  onChange: (value: string) => void;
  onConfirm: () => void;
}

const TypeToggle = ({
  value,
  onChange,
  onConfirm,
}: TypeToggleProps & { ref?: React.Ref<HTMLInputElement> }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        onChange(value === 'expense' ? 'income' : 'expense');
      }
    },
    [onConfirm, onChange, value]
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
    >
      <button
        type="button"
        onClick={() => {
          onChange('expense');
          onConfirm();
        }}
        className={`flex-1 rounded-md px-6 py-3 text-lg font-medium ${
          value === 'expense'
            ? 'bg-rose-500 text-white'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        지출
      </button>
      <button
        type="button"
        onClick={() => {
          onChange('income');
          onConfirm();
        }}
        className={`flex-1 rounded-md px-6 py-3 text-lg font-medium ${
          value === 'income'
            ? 'bg-emerald-500 text-white'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        수입
      </button>
    </div>
  );
};
