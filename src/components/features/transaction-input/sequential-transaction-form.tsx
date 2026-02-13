'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CategoryGroup, TransactionInputOptions } from '@/types';
import { apiClient } from '@/lib/api-client';
import { useSequentialForm } from '@/hooks/use-sequential-form';
import { useRecommendations } from '@/hooks/use-recommendations';
import { CompletedFieldChips } from './completed-field-chips';
import { ActiveFieldInput } from './active-field-input';
import { StepIndicator } from './step-indicator';
import { SavedTransactionsList } from './saved-transactions-list';
import { RecommendationBar } from './recommendation-bar';
import type { FormOptions, RecommendationItem, SequentialFormState, StepField } from './types';
import { STEP_FIELDS } from './types';

interface SequentialTransactionFormProps {
  year: number;
  month: number;
}

const DEFAULT_PAYMENT_METHODS = ['현대카드', '신한카드', '계좌이체', '현금'];
const DEFAULT_USERS = ['지완', '지아'];

export function SequentialTransactionForm({ year, month }: SequentialTransactionFormProps) {
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const form = useSequentialForm(defaultDate);

  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(DEFAULT_PAYMENT_METHODS);
  const [users, setUsers] = useState<string[]>(DEFAULT_USERS);
  const [paymentMethodsByUser, setPaymentMethodsByUser] = useState<Record<string, string[]>>({});

  // Fetch categories when type changes
  useEffect(() => {
    let cancelled = false;
    apiClient.categories
      .getGrouped<CategoryGroup[]>(form.formState.type)
      .then(data => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [form.formState.type]);

  useEffect(() => {
    let cancelled = false;

    apiClient.transactions
      .getOptions<TransactionInputOptions>(form.formState.type)
      .then(data => {
        if (cancelled) return;

        setPaymentMethods(
          data.paymentMethods.length > 0 ? data.paymentMethods : DEFAULT_PAYMENT_METHODS
        );
        setUsers(data.users.length > 0 ? data.users : DEFAULT_USERS);
        setPaymentMethodsByUser(data.paymentMethodsByUser ?? {});
      })
      .catch(() => {
        if (cancelled) return;

        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
        setUsers(DEFAULT_USERS);
        setPaymentMethodsByUser({});
      });

    return () => {
      cancelled = true;
    };
  }, [form.formState.type]);

  const { recommendations, isLoading: recLoading } = useRecommendations(
    year,
    month,
    form.formState.type,
    categories
  );

  const options: FormOptions = useMemo(
    () => ({ categories, paymentMethods, users, paymentMethodsByUser }),
    [categories, paymentMethods, users, paymentMethodsByUser]
  );

  const getPaymentMethodsForUser = useCallback(
    (user: string): string[] => {
      const trimmedUser = user.trim();
      const userMethods = trimmedUser ? (paymentMethodsByUser[trimmedUser] ?? []) : [];
      return userMethods.length > 0 ? userMethods : paymentMethods;
    },
    [paymentMethods, paymentMethodsByUser]
  );

  const getCategoryName = useCallback(
    (categoryId: string): string => {
      for (const group of categories) {
        if (group.id === categoryId) return group.name;
        for (const child of group.children ?? []) {
          if (child.id === categoryId) return child.name;
        }
      }
      return '';
    },
    [categories]
  );

  const handleSave = useCallback(() => {
    const categoryName = getCategoryName(form.formState.categoryId);
    form.save(categoryName);
  }, [form, getCategoryName]);

  const handleFieldChange = useCallback(
    (field: StepField, value: string) => {
      if (field === 'user') {
        form.setFieldValue('user', value);

        const currentPaymentMethod = form.formState.paymentMethod;
        if (currentPaymentMethod) {
          const allowedMethods = new Set(getPaymentMethodsForUser(value));
          if (!allowedMethods.has(currentPaymentMethod)) {
            form.setFieldValue('paymentMethod', '');
          }
        }
        return;
      }

      form.setFieldValue(field, value);
    },
    [form, getPaymentMethodsForUser]
  );

  const handleRecommendationSelect = useCallback(
    (item: RecommendationItem) => {
      if (item.source === 'lastMonth') {
        // "최근 카테고리" — only set categoryId, advance to next step
        form.setMultipleFields({ categoryId: item.categoryId });
        form.goToStep(4);
        return;
      }

      // Templates — set all available fields
      const values: Partial<SequentialFormState> = {
        categoryId: item.categoryId,
      };
      if (item.paymentMethod) values.paymentMethod = item.paymentMethod;
      if (item.amount) values.amount = String(item.amount);
      if (item.description) values.description = item.description;

      form.setMultipleFields(values);

      // Find the first empty required field after categoryId
      const filledKeys = new Set(Object.keys(values) as StepField[]);
      for (let i = 3; i < STEP_FIELDS.length; i++) {
        const field = STEP_FIELDS[i];
        if (!filledKeys.has(field)) {
          form.goToStep(i);
          return;
        }
      }
      // All fields filled — go to last step
      form.goToStep(STEP_FIELDS.length - 1);
    },
    [form]
  );

  // Show recommendation bar only at the category step (step 3)
  const showRecommendations = form.currentStep === 3;

  return (
    <div className="mx-auto max-w-lg">
      {/* Status feedback */}
      {form.status === 'saving' && (
        <div className="mb-4 text-center text-sm text-zinc-400 dark:text-zinc-500">저장 중...</div>
      )}
      {form.status === 'saved' && (
        <div className="mb-4 text-center text-sm text-emerald-500 dark:text-emerald-400">
          저장 완료
        </div>
      )}
      {form.status === 'error' && (
        <div className="mb-4 text-center text-sm text-rose-500 dark:text-rose-400">
          {form.errorMessage}
        </div>
      )}

      {/* Recommendation bar */}
      {showRecommendations && (
        <div className="mb-6">
          <RecommendationBar
            recommendations={recommendations}
            isLoading={recLoading}
            onSelect={handleRecommendationSelect}
          />
        </div>
      )}

      {/* Completed field chips */}
      <div className="mb-6">
        <CompletedFieldChips
          formState={form.formState}
          currentStep={form.currentStep}
          onChipClick={form.goToStep}
          getCategoryName={getCategoryName}
        />
      </div>

      {/* Active field input */}
      <div className="mb-8">
        <ActiveFieldInput
          formState={form.formState}
          currentStep={form.currentStep}
          options={options}
          onFieldChange={handleFieldChange}
          onAdvance={form.advanceStep}
          onSkip={form.skipStep}
          onSave={handleSave}
          canSave={form.canSave}
        />
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={form.currentStep} />
      </div>

      {/* Saved transactions list */}
      <SavedTransactionsList transactions={form.savedTransactions} />
    </div>
  );
}
