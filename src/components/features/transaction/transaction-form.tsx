'use client';

import { useState, useEffect, FormEvent, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Button, Tabs, TabsList, TabsTrigger } from '@/components/ui';
import type { TransactionType, TransactionFormData, CategoryBase } from '@/types';

const PAYMENT_METHODS = [
  { value: '현대카드', label: '현대카드' },
  { value: '신한카드', label: '신한카드' },
  { value: '계좌이체', label: '계좌이체' },
  { value: '현금', label: '현금' },
];

const FAMILY_MEMBERS = [
  { value: '지완', label: '지완' },
  { value: '지아', label: '지아' },
];

interface TransactionFormProps {
  defaultDate?: string;
}

export function TransactionForm({ defaultDate }: TransactionFormProps) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [user, setUser] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<CategoryBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);
  const categoryRef = useRef<HTMLSelectElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const paymentRef = useRef<HTMLSelectElement | null>(null);
  const userRef = useRef<HTMLSelectElement | null>(null);
  const descriptionRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?type=${type}`);
        const result = await response.json();
        if (result.success) {
          setCategories(result.data);
          setCategoryId('');
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, [type]);

  const handleTypeChange = (newType: string) => {
    setType(newType as TransactionType);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || !categoryId) {
      setError('금액과 카테고리를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const formData: TransactionFormData = {
        type,
        amount: parseFloat(amount),
        categoryId,
        date,
        paymentMethod: paymentMethod || undefined,
        user: user || undefined,
        description: description || undefined,
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setAmount('');
        setCategoryId('');
        setPaymentMethod('');
        setUser('');
        setDescription('');
        router.refresh();
        amountRef.current?.focus();
      } else {
        setError(result.error || '거래 저장에 실패했습니다.');
      }
    } catch (err) {
      setError('거래 저장 중 오류가 발생했습니다.');
      console.error('Failed to create transaction:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.icon || ''} ${cat.name}`.trim(),
  }));

  const formattedAmount = useMemo(() => {
    if (!amount) return '';
    const numeric = Number(amount);
    if (Number.isNaN(numeric)) return '';
    return numeric.toLocaleString('ko-KR');
  }, [amount]);

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    setAmount(digits);
  };

  const handleCellNavigation = (index: number, direction: 'left' | 'right') => {
    const cells = [
      amountRef.current,
      categoryRef.current,
      dateRef.current,
      paymentRef.current,
      userRef.current,
      descriptionRef.current,
    ];
    const nextIndex = direction === 'right' ? index + 1 : index - 1;
    const target = cells[nextIndex];
    if (target) {
      target.focus();
    }
  };

  const createCellKeyDownHandler =
    (index: number) => (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (
        event.key === 'ArrowRight' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleCellNavigation(index, 'right');
      }
      if (
        event.key === 'ArrowLeft' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleCellNavigation(index, 'left');
      }
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="expense" onChange={handleTypeChange}>
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">
            지출
          </TabsTrigger>
          <TabsTrigger value="income" className="flex-1">
            수입
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="grid grid-cols-6 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <div className="px-3 py-2">금액</div>
          <div className="px-3 py-2">카테고리</div>
          <div className="px-3 py-2">날짜</div>
          <div className="px-3 py-2">결제 수단</div>
          <div className="px-3 py-2">사용자</div>
          <div className="px-3 py-2">메모</div>
        </div>
        <div className="grid grid-cols-6 gap-0">
          <div className="border-r border-zinc-200 px-2 py-2 dark:border-zinc-700">
            <Input
              ref={amountRef}
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formattedAmount}
              onChange={e => handleAmountChange(e.target.value)}
              onKeyDown={createCellKeyDownHandler(0)}
              aria-label="금액"
              className="w-full rounded-md border-zinc-200 bg-transparent px-2 py-2 text-right text-base dark:border-zinc-600"
              required
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-2 dark:border-zinc-700">
            <Select
              ref={categoryRef}
              options={categoryOptions}
              placeholder="카테고리 선택"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              onKeyDown={createCellKeyDownHandler(1)}
              aria-label="카테고리"
              className="w-full rounded-md border-zinc-200 bg-transparent px-2 py-2 text-base dark:border-zinc-600"
              required
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-2 dark:border-zinc-700">
            <Input
              ref={dateRef}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              onKeyDown={createCellKeyDownHandler(2)}
              aria-label="날짜"
              className="w-full rounded-md border-zinc-200 bg-transparent px-2 py-2 text-base dark:border-zinc-600"
              required
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-2 dark:border-zinc-700">
            <Select
              ref={paymentRef}
              options={PAYMENT_METHODS}
              placeholder="결제 수단 선택"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              onKeyDown={createCellKeyDownHandler(3)}
              aria-label="결제 수단"
              className="w-full rounded-md border-zinc-200 bg-transparent px-2 py-2 text-base dark:border-zinc-600"
            />
          </div>
          <div className="border-r border-zinc-200 px-2 py-2 dark:border-zinc-700">
            <Select
              ref={userRef}
              options={FAMILY_MEMBERS}
              placeholder="사용자 선택"
              value={user}
              onChange={e => setUser(e.target.value)}
              onKeyDown={createCellKeyDownHandler(4)}
              aria-label="사용자"
              className="w-full rounded-md border-zinc-200 bg-transparent px-2 py-2 text-base dark:border-zinc-600"
            />
          </div>
          <div className="px-2 py-2">
            <Input
              ref={descriptionRef}
              type="text"
              placeholder="메모 (선택)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={createCellKeyDownHandler(5)}
              aria-label="메모"
              className="w-full rounded-md border-zinc-200 bg-transparent px-2 py-2 text-base dark:border-zinc-600"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
