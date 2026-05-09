import type { ApiResponse, DashboardData } from '@/types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new ApiError(result.error ?? 'Unknown error', response.status);
  }

  return result.data as T;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null) {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const apiClient = {
  dashboard: {
    getMonthly(year: number, month: number): Promise<DashboardData> {
      return request<DashboardData>(`/api/dashboard${buildQuery({ year, month })}`);
    },
  },

  asset: {
    getMonthly<T>(year: number, month: number): Promise<T> {
      return request<T>(`/api/asset/monthly${buildQuery({ year, month })}`);
    },
    getMonthlyWithDelta<T>(year: number, month: number): Promise<T> {
      return request<T>(`/api/asset/monthly${buildQuery({ year, month, withDelta: 'true' })}`);
    },
    getTrend<T>(
      startYear: number,
      startMonth: number,
      endYear: number,
      endMonth: number
    ): Promise<T> {
      return request<T>(
        `/api/asset/trend${buildQuery({ startYear, startMonth, endYear, endMonth })}`
      );
    },
    getTransactions<T>(year: number, month: number): Promise<T> {
      return request<T>(`/api/asset/transactions${buildQuery({ year, month })}`);
    },
    createTransaction(data: {
      accountId: string;
      assetMasterId: string;
      transactionType: string;
      date: string;
      quantity: number;
      priceOriginal: number;
      priceKRW: number;
      exchangeRate?: number | null;
      notes?: string | null;
    }) {
      return request<unknown>('/api/asset/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    deleteTransaction(id: string) {
      return request<unknown>(`/api/asset/transactions/${id}`, {
        method: 'DELETE',
      });
    },
    getHoldings<T>(): Promise<T> {
      return request<T>('/api/asset/holdings');
    },
    getInstitutions<T>(): Promise<T> {
      return request<T>('/api/asset/institutions');
    },
    createInstitution<T>(data: { name: string; type: string }): Promise<T> {
      return request<T>('/api/asset/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    getAccounts<T>(institutionId?: string): Promise<T> {
      return request<T>(`/api/asset/accounts${buildQuery({ institutionId })}`);
    },
    createAccount<T>(data: {
      name: string;
      accountType: string;
      institutionId: string;
      memberId: string;
    }): Promise<T> {
      return request<T>('/api/asset/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    getAssetMasters<T>(): Promise<T> {
      return request<T>('/api/asset/asset-masters');
    },
    createAssetMaster<T>(data: {
      name: string;
      assetClass: string;
      currency?: string;
      riskLevel?: string;
    }): Promise<T> {
      return request<T>('/api/asset/asset-masters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    getMembers<T>(): Promise<T> {
      return request<T>('/api/asset/members');
    },
  },

  transactions: {
    list<T>(
      params: { year: number; month: number } | { startDate: string; endDate: string }
    ): Promise<T> {
      return request<T>(`/api/transactions${buildQuery(params)}`);
    },

    create(data: {
      type: string;
      amount: number;
      categoryId: string;
      date: string;
      paymentMethod?: string | null;
      user?: string | null;
      description?: string | null;
    }) {
      return request<{ id: string }>('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },

    update(
      id: string,
      data: {
        type: string;
        amount: number;
        categoryId: string;
        date: string;
        paymentMethod?: string | null;
        user?: string | null;
        description?: string | null;
      }
    ) {
      return request<unknown>(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },

    delete(id: string) {
      return request<unknown>(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
    },

    getOptions<T>(type?: 'income' | 'expense'): Promise<T> {
      return request<T>(`/api/transactions/options${buildQuery({ type })}`);
    },
  },

  templates: {
    getAll<T>(type?: 'income' | 'expense'): Promise<T> {
      return request<T>(`/api/templates${buildQuery({ type })}`);
    },
  },

  categories: {
    getGrouped<T>(type: 'income' | 'expense'): Promise<T> {
      return request<T>(`/api/categories${buildQuery({ type, grouped: 'true' })}`);
    },

    getFlat<T>(type?: 'income' | 'expense'): Promise<T> {
      return request<T>(`/api/categories${buildQuery({ type })}`);
    },
  },
};

export { ApiError };
