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
              ? 'w-6 bg-accent'
              : idx < currentStep
                ? 'w-1.5 bg-accent-hover'
                : 'w-1.5 bg-surface-soft'
          }`}
        />
      ))}
    </div>
  );
}
