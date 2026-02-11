'use client';

import { STEP_FIELDS } from './types';

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {STEP_FIELDS.map((_, idx) => (
        <div
          key={idx}
          className={`h-1.5 rounded-full ${
            idx === currentStep
              ? 'w-6 bg-blue-500 dark:bg-blue-400'
              : idx < currentStep
                ? 'w-1.5 bg-blue-300 dark:bg-blue-600'
                : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );
}
