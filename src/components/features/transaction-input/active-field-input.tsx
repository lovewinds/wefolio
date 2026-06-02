'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TransactionType, CategoryGroup } from '@/types';
import type { ComboboxHandle, ComboboxOption, ComboboxOptionGroup } from '@/components/ui/combobox';
import { Combobox } from '@/components/ui';
import type { SequentialFormState, StepField, FormOptions, RecommendationItem } from './types';
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
  recommendations?: RecommendationItem[];
  recLoading?: boolean;
  onRecommendationSelect?: (item: RecommendationItem) => void;
  amountHint?: number | null;
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
  recommendations = [],
  recLoading = false,
  onRecommendationSelect,
  amountHint,
}: ActiveFieldInputProps) {
  const field = STEP_FIELDS[currentStep];
  if (!field) return null;

  const isOptional = OPTIONAL_STEPS.has(field);
  const isLastStep = currentStep === STEP_FIELDS.length - 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <label className="text-lg font-medium text-ink-muted">
        {STEP_LABELS[field]}
        {isOptional && <span className="ml-2 text-sm font-normal text-ink-subtle">(선택)</span>}
      </label>

      <div className="w-full max-w-md">
        <FieldInput
          field={field}
          value={formState[field]}
          selectedUser={formState.user}
          options={options}
          onChange={value => onFieldChange(field, value)}
          onConfirm={isLastStep && canSave ? onSave : onAdvance}
          recommendations={recommendations}
          recLoading={recLoading}
          onRecommendationSelect={onRecommendationSelect}
          amountHint={amountHint}
        />
      </div>

      <div className="flex items-center gap-3">
        {isOptional && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-ink-subtle hover:text-ink-muted"
          >
            건너뛰기
          </button>
        )}
        {isLastStep && canSave && (
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-on-accent hover:bg-accent-press"
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
  recommendations?: RecommendationItem[];
  recLoading?: boolean;
  onRecommendationSelect?: (item: RecommendationItem) => void;
  amountHint?: number | null;
}

function FieldInput({
  field,
  value,
  selectedUser,
  options,
  onChange,
  onConfirm,
  recommendations = [],
  recLoading = false,
  onRecommendationSelect,
  amountHint,
}: FieldInputProps) {
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
          className="w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-lg text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      );

    case 'description':
      return (
        <DescriptionInput
          ref={inputRef}
          value={value}
          recommendations={recommendations}
          recLoading={recLoading}
          onChange={onChange}
          onConfirm={onConfirm}
          onRecommendationSelect={onRecommendationSelect}
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
        <AmountInput
          ref={inputRef}
          value={value}
          amountHint={amountHint}
          onChange={onChange}
          onConfirm={onConfirm}
        />
      );

    default:
      return null;
  }
}

// DescriptionInput with inline suggestions
interface DescriptionInputProps {
  value: string;
  recommendations: RecommendationItem[];
  recLoading: boolean;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onRecommendationSelect?: (item: RecommendationItem) => void;
  ref?: React.Ref<HTMLInputElement>;
}

const DescriptionInput = ({
  value,
  recommendations,
  recLoading,
  onChange,
  onConfirm,
  onRecommendationSelect,
  ref,
}: DescriptionInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showError, setShowError] = useState(false);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Expose inner ref
  useEffect(() => {
    if (typeof ref === 'function') ref(inputRef.current);
    else if (ref && 'current' in ref)
      (ref as React.MutableRefObject<HTMLInputElement | null>).current = inputRef.current;
  }, [ref]);

  const hasSuggestions = !recLoading && recommendations.length > 0 && value.trim().length >= 2;
  const visible = showSuggestions && hasSuggestions;

  const handleSelect = useCallback(
    (item: RecommendationItem) => {
      setShowSuggestions(false);
      onRecommendationSelect?.(item);
    },
    [onRecommendationSelect]
  );

  const handleConfirm = useCallback(() => {
    if (!value.trim()) {
      setShowError(true);
      inputRef.current?.focus();
      return;
    }
    setShowError(false);
    onConfirm();
  }, [value, onConfirm]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.isComposing) return;

      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }

      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (visible) {
          // Focus first suggestion
          suggestionRefs.current[0]?.focus();
        } else {
          handleConfirm();
        }
        return;
      }

      if (e.key === 'ArrowDown' && visible) {
        e.preventDefault();
        suggestionRefs.current[0]?.focus();
      }
    },
    [visible, handleConfirm]
  );

  const handleSuggestionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(recommendations[idx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        inputRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(idx + 1, recommendations.length - 1);
        suggestionRefs.current[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx === 0) {
          inputRef.current?.focus();
        } else {
          suggestionRefs.current[idx - 1]?.focus();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (idx < recommendations.length - 1) {
          suggestionRefs.current[idx + 1]?.focus();
        } else {
          // Past last suggestion — advance to next step with current value
          setShowSuggestions(false);
          handleConfirm();
        }
      }
    },
    [recommendations, handleSelect, handleConfirm]
  );

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setShowError(false);
        }}
        onKeyDown={handleInputKeyDown}
        onFocus={() => setShowSuggestions(true)}
        placeholder="내역 입력..."
        className={`w-full rounded-lg border px-4 py-3 text-lg text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 ${
          showError
            ? 'loss-soft border-loss focus:border-loss focus:ring-loss'
            : 'border-hairline bg-surface focus:border-accent focus:ring-accent'
        }`}
      />

      {showError && <p className="mt-1.5 text-sm text-loss">내역을 입력해 주세요</p>}

      {visible && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-hairline bg-surface shadow-lg">
          {recommendations.map((item, idx) => (
            <button
              key={item.id}
              ref={el => {
                suggestionRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => handleSelect(item)}
              onKeyDown={e => handleSuggestionKeyDown(e, idx)}
              className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-canvas focus:bg-canvas focus:outline-none"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink">{item.label}</span>
                {item.count && item.count > 1 && (
                  <span className="shrink-0 text-xs text-ink-subtle">최근 {item.count}회</span>
                )}
                {item.source === 'template' && (
                  <span className="shrink-0 rounded-full accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    고정
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <span>{item.categoryName}</span>
                {item.paymentMethod && (
                  <>
                    <span>·</span>
                    <span>{item.paymentMethod}</span>
                  </>
                )}
                {item.amount && (
                  <>
                    <span>·</span>
                    <span>{item.amount.toLocaleString()}원</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// AmountInput with optional hint placeholder
interface AmountInputProps {
  value: string;
  amountHint?: number | null;
  onChange: (value: string) => void;
  onConfirm: () => void;
  ref?: React.Ref<HTMLInputElement>;
}

const AmountInput = ({ value, amountHint, onChange, onConfirm, ref }: AmountInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof ref === 'function') ref(inputRef.current);
    else if (ref && 'current' in ref)
      (ref as React.MutableRefObject<HTMLInputElement | null>).current = inputRef.current;
  }, [ref]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        // If empty and hint available, adopt hint
        if (!value && amountHint) {
          onChange(String(amountHint));
        }
        onConfirm();
      }
    },
    [value, amountHint, onChange, onConfirm]
  );

  const placeholder = amountHint ? `지난달: ${amountHint.toLocaleString()}원` : '금액 입력...';

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
        placeholder={placeholder}
        className="w-full rounded-lg border border-hairline bg-surface px-4 py-3 pr-10 text-lg text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle">원</span>
    </div>
  );
};

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
      className="flex gap-2 rounded-lg border border-hairline bg-surface-soft p-1 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <button
        type="button"
        onClick={() => {
          onChange('expense');
          onConfirm();
        }}
        className={`flex-1 rounded-md px-6 py-3 text-lg font-medium ${
          value === 'expense' ? 'bg-loss text-on-accent' : 'text-ink-subtle hover:text-ink-muted'
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
          value === 'income' ? 'bg-gain text-on-accent' : 'text-ink-subtle hover:text-ink-muted'
        }`}
      >
        수입
      </button>
    </div>
  );
};
