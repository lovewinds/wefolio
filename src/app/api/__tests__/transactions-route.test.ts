import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/transactions/route';
import { DELETE, PUT } from '@/app/api/transactions/[id]/route';
import { transactionService } from '@/services/transaction-service';

vi.mock('@/services/transaction-service', () => ({
  transactionService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('POST /api/transactions', () => {
  it('returns 400 for an invalid body', async () => {
    const response = await POST(jsonRequest('/api/transactions', { amount: -1 }));
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
    expect(transactionService.create).not.toHaveBeenCalled();
  });

  it('creates a transaction and returns 201 for a valid body', async () => {
    const now = new Date('2026-05-06T00:00:00.000Z');
    const createdTransaction = {
      id: 'tx-1',
      type: 'expense',
      amount: 1200,
      description: 'Lunch',
      date: now,
      categoryId: 'category-1',
      paymentMethod: 'Card',
      user: 'Alice',
      createdAt: now,
      updatedAt: now,
    };

    vi.mocked(transactionService.create).mockResolvedValue(createdTransaction);

    const response = await POST(
      jsonRequest('/api/transactions', {
        type: 'expense',
        amount: 1200,
        categoryId: 'category-1',
        date: '2026-05-06',
        paymentMethod: 'Card',
        user: 'Alice',
        description: 'Lunch',
      })
    );
    const body = (await response.json()) as ApiBody<typeof createdTransaction>;

    expect(response.status).toBe(201);
    expect(body).toEqual({
      success: true,
      data: {
        ...createdTransaction,
        date: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    });
    expect(transactionService.create).toHaveBeenCalledWith({
      type: 'expense',
      amount: 1200,
      description: 'Lunch',
      date: new Date('2026-05-06T00:00:00.000Z'),
      category: { connect: { id: 'category-1' } },
      paymentMethod: 'Card',
      user: 'Alice',
    });
  });

  it('returns 500 when the service throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(transactionService.create).mockRejectedValue(new Error('database failed'));

    const response = await POST(jsonRequest('/api/transactions', validTransactionBody()));
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Failed to create transaction' });

    consoleError.mockRestore();
  });
});

describe('PUT /api/transactions/[id]', () => {
  it('returns 400 when id is missing', async () => {
    const response = await PUT(jsonRequest('/api/transactions/', validTransactionBody()), {
      params: Promise.resolve({ id: '' }),
    });
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'Missing id parameter' });
    expect(transactionService.update).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid body', async () => {
    const response = await PUT(jsonRequest('/api/transactions/tx-1', { type: 'expense' }), {
      params: Promise.resolve({ id: 'tx-1' }),
    });
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
    expect(transactionService.update).not.toHaveBeenCalled();
  });

  it('updates a transaction for a valid body', async () => {
    const now = new Date('2026-05-06T00:00:00.000Z');
    const updatedTransaction = {
      id: 'tx-1',
      type: 'expense',
      amount: 2500,
      description: null,
      date: now,
      categoryId: 'category-1',
      paymentMethod: null,
      user: null,
      createdAt: now,
      updatedAt: now,
    };

    vi.mocked(transactionService.update).mockResolvedValue(updatedTransaction);

    const response = await PUT(jsonRequest('/api/transactions/tx-1', validTransactionBody()), {
      params: Promise.resolve({ id: 'tx-1' }),
    });
    const body = (await response.json()) as ApiBody<typeof updatedTransaction>;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        ...updatedTransaction,
        date: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    });
    expect(transactionService.update).toHaveBeenCalledWith('tx-1', {
      type: 'expense',
      amount: 2500,
      description: null,
      date: new Date('2026-05-06T00:00:00.000Z'),
      category: { connect: { id: 'category-1' } },
      paymentMethod: null,
      user: null,
    });
  });

  it('returns 500 when update throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(transactionService.update).mockRejectedValue(new Error('database failed'));

    const response = await PUT(jsonRequest('/api/transactions/tx-1', validTransactionBody()), {
      params: Promise.resolve({ id: 'tx-1' }),
    });
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Failed to update transaction' });

    consoleError.mockRestore();
  });
});

describe('DELETE /api/transactions/[id]', () => {
  it('returns 400 when id is missing', async () => {
    const response = await DELETE(
      new Request('http://localhost/api/transactions/', { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: '' }),
      }
    );
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'Missing id parameter' });
    expect(transactionService.delete).not.toHaveBeenCalled();
  });

  it('deletes a transaction', async () => {
    const now = new Date('2026-05-06T00:00:00.000Z');
    vi.mocked(transactionService.delete).mockResolvedValue({
      id: 'tx-1',
      type: 'expense',
      amount: 2500,
      description: null,
      date: now,
      categoryId: 'category-1',
      paymentMethod: null,
      user: null,
      createdAt: now,
      updatedAt: now,
    });

    const response = await DELETE(
      new Request('http://localhost/api/transactions/tx-1', { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: 'tx-1' }),
      }
    );
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(transactionService.delete).toHaveBeenCalledWith('tx-1');
  });

  it('returns 500 when delete throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(transactionService.delete).mockRejectedValue(new Error('database failed'));

    const response = await DELETE(
      new Request('http://localhost/api/transactions/tx-1', { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: 'tx-1' }),
      }
    );
    const body = (await response.json()) as ApiBody;

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Failed to delete transaction' });

    consoleError.mockRestore();
  });
});

type ApiBody<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validTransactionBody() {
  return {
    type: 'expense',
    amount: 2500,
    categoryId: 'category-1',
    date: '2026-05-06',
    paymentMethod: null,
    user: null,
    description: null,
  };
}
