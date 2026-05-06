import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recurringTemplateRepository } from '@/repositories/recurring-template-repository';
import { transactionRepository } from '@/repositories/transaction-repository';
import { transactionService } from '@/services/transaction-service';

vi.mock('@/repositories/transaction-repository', () => ({
  transactionRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByDateRange: vi.fn(),
    findDistinctUsers: vi.fn(),
    findDistinctPaymentMethods: vi.fn(),
    findUserPaymentMethodPairs: vi.fn(),
    getDateRange: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/repositories/recurring-template-repository', () => ({
  recurringTemplateRepository: {
    findById: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('transactionService', () => {
  it('calls repository with the UTC start and end of the requested month', async () => {
    vi.mocked(transactionRepository.findByDateRange).mockResolvedValue([]);

    await transactionService.getByMonth(2026, 2);

    expect(transactionRepository.findByDateRange).toHaveBeenCalledWith(
      new Date('2026-02-01T00:00:00.000Z'),
      new Date('2026-02-28T23:59:59.999Z')
    );
  });

  it('normalizes input options and groups payment methods by user', async () => {
    vi.mocked(transactionRepository.findDistinctUsers).mockResolvedValue([
      ' Bob ',
      'Alice',
      'Bob',
      '',
    ]);
    vi.mocked(transactionRepository.findDistinctPaymentMethods).mockResolvedValue([
      ' Card ',
      'Cash',
      'Card',
      ' ',
    ]);
    vi.mocked(transactionRepository.findUserPaymentMethodPairs).mockResolvedValue([
      { user: 'Bob', paymentMethod: ' Card ' },
      { user: ' Bob ', paymentMethod: 'Cash' },
      { user: 'Alice', paymentMethod: 'Cash' },
      { user: 'Alice', paymentMethod: 'Cash' },
      { user: ' ', paymentMethod: 'Card' },
    ]);

    const result = await transactionService.getInputOptions('expense');

    expect(transactionRepository.findDistinctUsers).toHaveBeenCalledWith('expense');
    expect(transactionRepository.findDistinctPaymentMethods).toHaveBeenCalledWith('expense');
    expect(transactionRepository.findUserPaymentMethodPairs).toHaveBeenCalledWith('expense');
    expect(result).toEqual({
      users: ['Alice', 'Bob'],
      paymentMethods: ['Card', 'Cash'],
      paymentMethodsByUser: {
        Alice: ['Cash'],
        Bob: ['Card', 'Cash'],
      },
    });
  });

  it('throws when creating from a missing template', async () => {
    vi.mocked(recurringTemplateRepository.findById).mockResolvedValue(null);

    await expect(
      transactionService.createFromTemplate('missing-template', new Date('2026-05-01T00:00:00Z'))
    ).rejects.toThrow('Template not found');
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it('creates a transaction from a template payload', async () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    const template = {
      id: 'template-1',
      name: 'Rent',
      type: 'expense',
      amount: 1000,
      description: 'Monthly rent',
      categoryId: 'category-1',
      createdAt: now,
      updatedAt: now,
    };
    const createdTransaction = {
      id: 'tx-1',
      type: 'expense',
      amount: 1000,
      description: 'Monthly rent',
      date: now,
      categoryId: 'category-1',
      paymentMethod: null,
      user: null,
      createdAt: now,
      updatedAt: now,
    };

    vi.mocked(recurringTemplateRepository.findById).mockResolvedValue(template);
    vi.mocked(transactionRepository.create).mockResolvedValue(createdTransaction);

    const result = await transactionService.createFromTemplate('template-1', now);

    expect(transactionRepository.create).toHaveBeenCalledWith({
      type: 'expense',
      amount: 1000,
      description: 'Monthly rent',
      date: now,
      category: { connect: { id: 'category-1' } },
    });
    expect(result).toBe(createdTransaction);
  });
});
