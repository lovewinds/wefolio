// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSequentialForm } from '@/hooks/use-sequential-form';
import { apiClient } from '@/lib/api-client';
import type { RenderHookResult } from '@testing-library/react';
import type { SavedTransaction } from '@/components/features/transaction-input/types';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    transactions: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('useSequentialForm', () => {
  it('hydrates current-month localStorage values into state and persisted fields', () => {
    localStorage.setItem('wefolio_last_user', 'Alice');
    localStorage.setItem('wefolio_last_type', 'income');
    localStorage.setItem('wefolio_last_date', '2026-05-03');

    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    expect(result.current.formState).toMatchObject({
      user: 'Alice',
      type: 'income',
      date: '2026-05-03',
    });
    expect([...result.current.persistedFields].sort()).toEqual(['date', 'type', 'user']);
    expect(result.current.currentStep).toBe(3);
  });

  it('falls back to defaultDate when stored date is outside the current month', () => {
    localStorage.setItem('wefolio_last_user', 'Alice');
    localStorage.setItem('wefolio_last_type', 'expense');
    localStorage.setItem('wefolio_last_date', '2026-04-30');

    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    expect(result.current.formState).toMatchObject({
      user: 'Alice',
      type: 'expense',
      date: '2026-05-10',
    });
    expect(result.current.persistedFields.has('date')).toBe(false);
    expect([...result.current.persistedFields].sort()).toEqual(['type', 'user']);
  });

  it('updates fields, moves between steps and skips optional steps', () => {
    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    expect(result.current.currentStep).toBe(0);

    act(() => result.current.setFieldValue('user', 'Alice'));
    expect(result.current.formState.user).toBe('Alice');

    act(() => result.current.advanceStep());
    expect(result.current.currentStep).toBe(1);

    act(() => result.current.goToStep(99));
    expect(result.current.currentStep).toBe(6);

    act(() => result.current.goToStep(-10));
    expect(result.current.currentStep).toBe(0);

    act(() => result.current.skipStep());
    expect(result.current.formState.user).toBe('');
    expect(result.current.currentStep).toBe(1);

    act(() => result.current.goToStep(5));
    act(() => result.current.setFieldValue('paymentMethod', 'Card'));
    act(() => result.current.skipStep());
    expect(result.current.formState.paymentMethod).toBe('');
    expect(result.current.currentStep).toBe(6);
  });

  it('removes a field from persistedFields when the user edits it', () => {
    localStorage.setItem('wefolio_last_user', 'Alice');
    localStorage.setItem('wefolio_last_type', 'expense');
    localStorage.setItem('wefolio_last_date', '2026-05-10');

    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    expect(result.current.persistedFields.has('user')).toBe(true);

    act(() => result.current.setFieldValue('user', 'Bob'));

    expect(result.current.formState.user).toBe('Bob');
    expect(result.current.persistedFields.has('user')).toBe(false);
  });

  it('creates a transaction, updates the saved list, resets the form and clears saved status', async () => {
    vi.useFakeTimers();
    vi.mocked(apiClient.transactions.create).mockResolvedValue({ id: 'tx-1' });
    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    fillSavableForm(result, { amount: '12,300' });

    await act(async () => {
      await result.current.save('Food');
    });

    expect(apiClient.transactions.create).toHaveBeenCalledWith({
      type: 'expense',
      amount: 12300,
      categoryId: 'category-1',
      date: '2026-05-10',
      paymentMethod: 'Card',
      user: 'Alice',
      description: 'Lunch',
    });
    expect(result.current.status).toBe('saved');
    expect(result.current.savedTransactions).toEqual([
      {
        id: 'tx-1',
        type: 'expense',
        categoryId: 'category-1',
        categoryName: 'Food',
        amount: 12300,
        description: 'Lunch',
        date: '2026-05-10',
        user: 'Alice',
        paymentMethod: 'Card',
      },
    ]);
    expect(result.current.formState).toMatchObject({
      user: 'Alice',
      type: 'expense',
      date: '2026-05-10',
      categoryId: '',
      paymentMethod: '',
      amount: '',
      description: '',
    });
    expect(result.current.currentStep).toBe(3);

    act(() => vi.advanceTimersByTime(800));
    expect(result.current.status).toBe('idle');
  });

  it('updates an edited transaction in the saved list', async () => {
    vi.useFakeTimers();
    vi.mocked(apiClient.transactions.create).mockResolvedValue({ id: 'tx-1' });
    vi.mocked(apiClient.transactions.update).mockResolvedValue({});
    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    fillSavableForm(result);
    await act(async () => {
      await result.current.save('Food');
    });

    act(() => result.current.startEdit(result.current.savedTransactions[0]));
    act(() => result.current.setFieldValue('amount', '45,000'));
    act(() => result.current.setFieldValue('categoryId', 'category-2'));

    await act(async () => {
      await result.current.save('Transport');
    });

    expect(apiClient.transactions.update).toHaveBeenCalledWith('tx-1', {
      type: 'expense',
      amount: 45000,
      categoryId: 'category-2',
      date: '2026-05-10',
      paymentMethod: 'Card',
      user: 'Alice',
      description: 'Lunch',
    });
    expect(result.current.editingId).toBeNull();
    expect(result.current.savedTransactions).toEqual([
      expect.objectContaining({
        id: 'tx-1',
        categoryId: 'category-2',
        categoryName: 'Transport',
        amount: 45000,
      }),
    ]);
  });

  it('sets error status when save fails', async () => {
    vi.mocked(apiClient.transactions.create).mockRejectedValue(new Error('Save failed'));
    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    fillSavableForm(result);
    await act(async () => {
      await result.current.save('Food');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Save failed');
    expect(result.current.savedTransactions).toEqual([]);
  });

  it('starts and cancels edit mode', () => {
    localStorage.setItem('wefolio_last_user', 'Alice');
    localStorage.setItem('wefolio_last_type', 'expense');
    localStorage.setItem('wefolio_last_date', '2026-05-10');
    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    act(() => result.current.startEdit(savedTransaction({ id: 'tx-1', user: 'Bob' })));

    expect(result.current.editingId).toBe('tx-1');
    expect(result.current.currentStep).toBe(6);
    expect(result.current.persistedFields.size).toBe(0);
    expect(result.current.formState.user).toBe('Bob');

    localStorage.setItem('wefolio_last_user', 'Alice');
    localStorage.setItem('wefolio_last_type', 'expense');
    localStorage.setItem('wefolio_last_date', '2026-05-10');

    act(() => result.current.cancelEdit());

    expect(result.current.editingId).toBeNull();
    expect(result.current.currentStep).toBe(3);
    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBe('');
    expect(result.current.formState).toMatchObject({
      user: 'Alice',
      type: 'expense',
      date: '2026-05-10',
      categoryId: '',
      paymentMethod: '',
      amount: '',
      description: '',
    });
    expect([...result.current.persistedFields].sort()).toEqual(['date', 'type', 'user']);
  });

  it('deletes a saved transaction successfully', async () => {
    vi.useFakeTimers();
    vi.mocked(apiClient.transactions.create).mockResolvedValue({ id: 'tx-1' });
    vi.mocked(apiClient.transactions.delete).mockResolvedValue({});
    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    fillSavableForm(result);
    await act(async () => {
      await result.current.save('Food');
    });

    await act(async () => {
      await result.current.deleteTransaction('tx-1');
    });

    expect(apiClient.transactions.delete).toHaveBeenCalledWith('tx-1');
    expect(result.current.savedTransactions).toEqual([]);
  });

  it('sets error status when delete fails after optimistic removal', async () => {
    vi.useFakeTimers();
    vi.mocked(apiClient.transactions.create).mockResolvedValue({ id: 'tx-1' });
    vi.mocked(apiClient.transactions.delete).mockRejectedValue(new Error('Delete failed'));
    const { result } = renderHook(() => useSequentialForm('2026-05-10'));

    fillSavableForm(result);
    await act(async () => {
      await result.current.save('Food');
    });

    await act(async () => {
      await result.current.deleteTransaction('tx-1');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Delete failed');
    expect(result.current.savedTransactions).toEqual([]);
  });
});

function fillSavableForm(
  result: RenderHookResult<ReturnType<typeof useSequentialForm>, unknown>['result'],
  overrides: Partial<ReturnType<typeof useSequentialForm>['formState']> = {}
) {
  act(() =>
    result.current.setMultipleFields({
      user: 'Alice',
      type: 'expense',
      date: '2026-05-10',
      categoryId: 'category-1',
      paymentMethod: 'Card',
      amount: '2500',
      description: 'Lunch',
      ...overrides,
    })
  );
}

function savedTransaction(overrides: Partial<SavedTransaction> = {}): SavedTransaction {
  return {
    id: 'tx-1',
    type: 'expense',
    categoryId: 'category-1',
    categoryName: 'Food',
    amount: 2500,
    description: 'Lunch',
    date: '2026-05-10',
    user: 'Alice',
    paymentMethod: 'Card',
    ...overrides,
  };
}
