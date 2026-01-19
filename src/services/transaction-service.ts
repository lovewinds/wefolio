import { transactionRepository } from '@/repositories/transaction-repository';
import { recurringTemplateRepository } from '@/repositories/recurring-template-repository';
import type { Transaction, Prisma } from '@prisma/client';

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    return transactionRepository.findAll();
  },

  async getById(id: string): Promise<Transaction | null> {
    return transactionRepository.findById(id);
  },

  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return transactionRepository.findByDateRange(startDate, endDate);
  },

  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return transactionRepository.create(data);
  },

  async createFromTemplate(templateId: string, date: Date): Promise<Transaction> {
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

  async update(id: string, data: Prisma.TransactionUpdateInput): Promise<Transaction> {
    return transactionRepository.update(id, data);
  },

  async delete(id: string): Promise<Transaction> {
    return transactionRepository.delete(id);
  },
};
