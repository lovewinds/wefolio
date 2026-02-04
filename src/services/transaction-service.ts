import { transactionRepository } from '@/repositories/transaction-repository';
import { recurringTemplateRepository } from '@/repositories/recurring-template-repository';
import { getMonthRangeUTC } from '@/lib/date-utils';
import type { BudgetTransaction, Prisma } from '@prisma/client';

export const transactionService = {
  async getAll(): Promise<BudgetTransaction[]> {
    return transactionRepository.findAll();
  },

  async getById(id: string): Promise<BudgetTransaction | null> {
    return transactionRepository.findById(id);
  },

  async getByMonth(year: number, month: number): Promise<BudgetTransaction[]> {
    const { start, end } = getMonthRangeUTC(year, month);
    return transactionRepository.findByDateRange(start, end);
  },

  async getDateRange(): Promise<{ min: Date | null; max: Date | null }> {
    return transactionRepository.getDateRange();
  },

  async create(data: Prisma.BudgetTransactionCreateInput): Promise<BudgetTransaction> {
    return transactionRepository.create(data);
  },

  async createFromTemplate(templateId: string, date: Date): Promise<BudgetTransaction> {
    const template = await recurringTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return transactionRepository.create({
      type: template.type,
      amount: template.amount,
      description: template.description,
      date,
      category: { connect: { id: template.categoryId } },
    });
  },

  async update(id: string, data: Prisma.BudgetTransactionUpdateInput): Promise<BudgetTransaction> {
    return transactionRepository.update(id, data);
  },

  async delete(id: string): Promise<BudgetTransaction> {
    return transactionRepository.delete(id);
  },
};
