'use client';

import { useCallback, useEffect, useState } from 'react';
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
import type { TransactionType } from '@/types';

const INITIAL_STATE: SequentialFormState = {
  user: '',
  type: 'expense',
  date: '',
  categoryId: '',
  paymentMethod: '',
  amount: '',
  description: '',
};

const STORAGE_KEYS = {
  USER: 'wefolio_last_user',
  TYPE: 'wefolio_last_type',
  DATE: 'wefolio_last_date',
};

export type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseSequentialFormReturn {
  formState: SequentialFormState;
  currentStep: number;
  status: FormStatus;
  errorMessage: string;
  savedTransactions: SavedTransaction[];
  persistedFields: Set<StepField>;
  editingId: string | null;
  setFieldValue: (field: StepField, value: string) => void;
  setMultipleFields: (values: Partial<SequentialFormState>) => void;
  advanceStep: () => void;
  goToStep: (step: number) => void;
  skipStep: () => void;
  save: (categoryName: string) => Promise<void>;
  canSave: boolean;
  startEdit: (tx: SavedTransaction) => void;
  cancelEdit: () => void;
  deleteTransaction: (id: string) => Promise<void>;
}

interface UseSequentialFormOptions {
  onDataChange?: () => void | Promise<void>;
}

export function useSequentialForm(
  defaultDate: string,
  options: UseSequentialFormOptions = {}
): UseSequentialFormReturn {
  const { onDataChange } = options;

  const [persistedFields, setPersistedFields] = useState<Set<StepField>>(() => {
    if (typeof window === 'undefined') return new Set();

    const fields = new Set<StepField>();
    if (localStorage.getItem(STORAGE_KEYS.USER)) fields.add('user');
    if (localStorage.getItem(STORAGE_KEYS.TYPE)) fields.add('type');
    // Only count date as persisted if it's valid for current month
    const savedDate = localStorage.getItem(STORAGE_KEYS.DATE);
    if (savedDate && savedDate.substring(0, 7) === defaultDate.substring(0, 7)) {
      fields.add('date');
    }
    return fields;
  });

  const [formState, setFormState] = useState<SequentialFormState>(() => {
    if (typeof window === 'undefined') return { ...INITIAL_STATE, date: defaultDate };

    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const savedType = localStorage.getItem(STORAGE_KEYS.TYPE);
    const savedDate = localStorage.getItem(STORAGE_KEYS.DATE);

    // Only use savedDate if it matches the current month's year/month (to avoid confusion)
    const isValidSavedDate = savedDate && savedDate.substring(0, 7) === defaultDate.substring(0, 7);

    return {
      ...INITIAL_STATE,
      user: savedUser || '',
      type: (savedType as TransactionType) || 'expense',
      date: isValidSavedDate ? savedDate : defaultDate,
    };
  });

  const [currentStep, setCurrentStep] = useState(() => {
    if (formState.user && formState.type && formState.date) return 3; // Start at description
    if (formState.user && formState.type) return 2; // Start at date
    if (formState.user) return 1; // Start at type
    return 0; // Start at user
  });

  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedTransactions, setSavedTransactions] = useState<SavedTransaction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Update localStorage when context fields change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, formState.user);
    localStorage.setItem(STORAGE_KEYS.TYPE, formState.type);
    localStorage.setItem(STORAGE_KEYS.DATE, formState.date);
  }, [formState.user, formState.type, formState.date]);

  const setFieldValue = useCallback((field: StepField, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    // Once user changes a persisted field, it's no longer "auto-filled from storage"
    setPersistedFields(prev => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
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

  const canSave = !!(
    formState.categoryId &&
    formState.date &&
    formState.amount &&
    formState.description
  );

  const save = useCallback(
    async (categoryName: string) => {
      if (!canSave) return;

      setStatus('saving');
      setErrorMessage('');

      try {
        if (editingId) {
          // Update existing transaction
          await apiClient.transactions.update(editingId, {
            type: formState.type,
            amount: parseFloat(formState.amount.replace(/,/g, '')),
            categoryId: formState.categoryId,
            date: formState.date,
            paymentMethod: formState.paymentMethod || null,
            user: formState.user || null,
            description: formState.description || null,
          });

          const updated: SavedTransaction = {
            id: editingId,
            type: formState.type,
            categoryId: formState.categoryId,
            categoryName,
            amount: parseFloat(formState.amount.replace(/,/g, '')),
            description: formState.description || undefined,
            date: formState.date,
            user: formState.user || undefined,
            paymentMethod: formState.paymentMethod || undefined,
          };

          setSavedTransactions(prev => prev.map(tx => (tx.id === editingId ? updated : tx)));
          setEditingId(null);
        } else {
          // Create new transaction
          const created = await apiClient.transactions.create({
            type: formState.type,
            amount: parseFloat(formState.amount.replace(/,/g, '')),
            categoryId: formState.categoryId,
            date: formState.date,
            paymentMethod: formState.paymentMethod || null,
            user: formState.user || null,
            description: formState.description || null,
          });

          const saved: SavedTransaction = {
            id: created.id,
            type: formState.type,
            categoryId: formState.categoryId,
            categoryName,
            amount: parseFloat(formState.amount.replace(/,/g, '')),
            description: formState.description || undefined,
            date: formState.date,
            user: formState.user || undefined,
            paymentMethod: formState.paymentMethod || undefined,
          };

          setSavedTransactions(prev => [saved, ...prev]);
        }

        setStatus('saved');
        void onDataChange?.();

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
    [canSave, formState, editingId, onDataChange]
  );

  const startEdit = useCallback((tx: SavedTransaction) => {
    setFormState({
      user: tx.user || '',
      type: tx.type,
      date: tx.date,
      categoryId: tx.categoryId,
      paymentMethod: tx.paymentMethod || '',
      amount: String(tx.amount),
      description: tx.description || '',
    });
    setEditingId(tx.id);
    setCurrentStep(STEP_FIELDS.length - 1);
    setStatus('idle');
    setErrorMessage('');
    // Fields are user-provided when editing, not from localStorage
    setPersistedFields(new Set());
  }, []);

  const cancelEdit = useCallback(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER) || '';
    const savedType = (localStorage.getItem(STORAGE_KEYS.TYPE) as TransactionType) || 'expense';
    const savedDate = localStorage.getItem(STORAGE_KEYS.DATE) || '';
    const isValidSavedDate = savedDate && savedDate.substring(0, 7) === defaultDate.substring(0, 7);

    setFormState({
      ...INITIAL_STATE,
      user: savedUser,
      type: savedType,
      date: isValidSavedDate ? savedDate : defaultDate,
    });
    setEditingId(null);
    setCurrentStep(RESET_TO_STEP);
    setStatus('idle');
    setErrorMessage('');
    setPersistedFields(
      new Set(['user', 'type', ...(isValidSavedDate ? ['date'] : [])] as StepField[])
    );
  }, [defaultDate]);

  const deleteTransaction = useCallback(
    async (id: string) => {
      // Optimistic update
      setSavedTransactions(prev => prev.filter(tx => tx.id !== id));

      try {
        await apiClient.transactions.delete(id);
        void onDataChange?.();
      } catch (err) {
        // Restore on failure — we don't have the original data easily, just show error
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '삭제 실패');
        // Reload is the safest fallback here, but we avoid that
      }
    },
    [onDataChange]
  );

  return {
    formState,
    currentStep,
    status,
    errorMessage,
    savedTransactions,
    persistedFields,
    editingId,
    setFieldValue,
    setMultipleFields,
    advanceStep,
    goToStep,
    skipStep,
    save,
    canSave,
    startEdit,
    cancelEdit,
    deleteTransaction,
  };
}
