'use client';

import type { SequentialFormState, StepField } from './types';
import { STEP_FIELDS, STEP_LABELS } from './types';

interface CompletedFieldChipsProps {
  formState: SequentialFormState;
  currentStep: number;
  onChipClick: (step: number) => void;
  getCategoryName: (id: string) => string;
  persistedFields: Set<StepField>;
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
      return isNaN(num) ? value : `${num.toLocaleString()}원`;
    }
    default:
      return value;
  }
}

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

export function CompletedFieldChips({
  formState,
  currentStep,
  onChipClick,
  getCategoryName,
  persistedFields,
}: CompletedFieldChipsProps) {
  const completedFields = STEP_FIELDS.slice(0, currentStep).filter(
    field => formState[field] !== ''
  );

  if (completedFields.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {completedFields.map(field => {
        const stepIndex = STEP_FIELDS.indexOf(field);
        const display = formatFieldValue(field, formState[field], getCategoryName);
        if (!display) return null;

        const isPersisted = persistedFields.has(field);

        return (
          <button
            key={field}
            type="button"
            onClick={() => onChipClick(stepIndex)}
            className={
              isPersisted
                ? 'inline-flex items-center gap-1 rounded-full border border-accent accent-soft px-3 py-1 text-sm text-accent hover:border-accent'
                : 'inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-soft px-3 py-1 text-sm text-ink-muted hover:border-accent hover:accent-soft hover:text-accent'
            }
          >
            {isPersisted && <PinIcon />}
            <span className={isPersisted ? 'text-xs text-accent' : 'text-xs text-ink-subtle'}>
              {STEP_LABELS[field]}
            </span>
            <span>{display}</span>
          </button>
        );
      })}
    </div>
  );
}
