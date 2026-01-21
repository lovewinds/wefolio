'use client';

import { useState, useEffect, FormEvent } from 'react';
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
        router.push('/');
        router.refresh();
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

      <Input
        type="number"
        label="금액"
        placeholder="금액을 입력하세요"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        min="0"
        step="1"
        required
      />

      <Select
        label="카테고리"
        options={categoryOptions}
        placeholder="카테고리 선택"
        value={categoryId}
        onChange={e => setCategoryId(e.target.value)}
        required
      />

      <Input
        type="date"
        label="날짜"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />

      <Select
        label="결제 수단"
        options={PAYMENT_METHODS}
        placeholder="결제 수단 선택"
        value={paymentMethod}
        onChange={e => setPaymentMethod(e.target.value)}
      />

      <Select
        label="사용자"
        options={FAMILY_MEMBERS}
        placeholder="사용자 선택"
        value={user}
        onChange={e => setUser(e.target.value)}
      />

      <Input
        type="text"
        label="메모"
        placeholder="메모를 입력하세요 (선택)"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

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
