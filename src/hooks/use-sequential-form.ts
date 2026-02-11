'use client';

import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  type SequentialFormState,
  type StepField,
  type SavedTransaction,
  STEP_FIELDS,
  PERSIST_AFTER_SAVE,
  RESET_TO_STEP,
  OPTIONAL_STEPS,
} from '@/components/features/transaction-input/types';

const INITIAL_STATE: SequentialFormState = {
  user: '',
  type: 'expense',
  date: '',
  categoryId: '',
  paymentMethod: '',
  amount: '',
  description: '',
};

export type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseSequentialFormReturn {
  formState: SequentialFormState;
  currentStep: number;
  status: FormStatus;
  errorMessage: string;
  savedTransactions: SavedTransaction[];
  setFieldValue: (field: StepField, value: string) => void;
  setMultipleFields: (values: Partial<SequentialFormState>) => void;
  advanceStep: () => void;
  goToStep: (step: number) => void;
  skipStep: () => void;
  save: (categoryName: string) => Promise<void>;
  canSave: boolean;
}

export function useSequentialForm(defaultDate: string): UseSequentialFormReturn {
  const [formState, setFormState] = useState<SequentialFormState>({
    ...INITIAL_STATE,
    date: defaultDate,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedTransactions, setSavedTransactions] = useState<SavedTransaction[]>([]);

  const setFieldValue = useCallback((field: StepField, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const setMultipleFields = useCallback((values: Partial<SequentialFormState>) => {
    setFormState(prev => ({ ...prev, ...values }));
  }, []);

  const advanceStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, STEP_FIELDS.length - 1));
    setStatus('idle');
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, STEP_FIELDS.length - 1)));
    setStatus('idle');
  }, []);

  const skipStep = useCallback(() => {
    const field = STEP_FIELDS[currentStep];
    if (field && OPTIONAL_STEPS.has(field)) {
      setFormState(prev => ({ ...prev, [field]: '' }));
      setCurrentStep(prev => Math.min(prev + 1, STEP_FIELDS.length - 1));
    }
  }, [currentStep]);

  const canSave = !!(formState.categoryId && formState.date && formState.amount);

  const save = useCallback(
    async (categoryName: string) => {
      if (!canSave) return;

      setStatus('saving');
      setErrorMessage('');

      try {
        await apiClient.transactions.create({
          type: formState.type,
          amount: parseFloat(formState.amount.replace(/,/g, '')),
          categoryId: formState.categoryId,
          date: formState.date,
          paymentMethod: formState.paymentMethod || null,
          user: formState.user || null,
          description: formState.description || null,
        });

        const saved: SavedTransaction = {
          id: crypto.randomUUID(),
          type: formState.type,
          categoryName,
          amount: parseFloat(formState.amount.replace(/,/g, '')),
          description: formState.description || undefined,
          date: formState.date,
          user: formState.user || undefined,
          paymentMethod: formState.paymentMethod || undefined,
        };

        setSavedTransactions(prev => [saved, ...prev]);
        setStatus('saved');

        // Reset: keep persisted fields, clear the rest
        setFormState(prev => {
          const next = { ...INITIAL_STATE };
          for (const field of PERSIST_AFTER_SAVE) {
            (next as Record<string, string>)[field] = prev[field];
          }
          return next;
        });
        setCurrentStep(RESET_TO_STEP);

        // Brief flash of "saved" status, then back to idle
        setTimeout(() => setStatus('idle'), 800);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '저장 실패');
      }
    },
    [canSave, formState]
  );

  return {
    formState,
    currentStep,
    status,
    errorMessage,
    savedTransactions,
    setFieldValue,
    setMultipleFields,
    advanceStep,
    goToStep,
    skipStep,
    save,
    canSave,
  };
}
