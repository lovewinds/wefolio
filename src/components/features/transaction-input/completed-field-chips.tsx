'use client';

import type { SequentialFormState, StepField } from './types';
import { STEP_FIELDS, STEP_LABELS } from './types';

interface CompletedFieldChipsProps {
  formState: SequentialFormState;
  currentStep: number;
  onChipClick: (step: number) => void;
  getCategoryName: (id: string) => string;
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

export function CompletedFieldChips({
  formState,
  currentStep,
  onChipClick,
  getCategoryName,
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

        return (
          <button
            key={field}
            type="button"
            onClick={() => onChipClick(stepIndex)}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
          >
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{STEP_LABELS[field]}</span>
            <span>{display}</span>
          </button>
        );
      })}
    </div>
  );
}
