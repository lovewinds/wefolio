import {
  institutionRepository,
  familyMemberRepository,
  accountRepository,
  accountSnapshotRepository,
} from '@/repositories/account-repository';
import { holdingRepository } from '@/repositories/holding-repository';
import type { Institution, FamilyMember, Account, Prisma } from '@prisma/client';
import type {
  InstitutionType,
  AccountType,
  MemberAssetSummary,
  InstitutionSummary,
  AccountSummary,
} from '@/types/asset';

// ============================================
// Institution Service
// ============================================

export const institutionService = {
  async getAll(): Promise<Institution[]> {
    return institutionRepository.findAll();
  },

  async getById(id: string): Promise<Institution | null> {
    return institutionRepository.findById(id);
  },

  async getByType(type: InstitutionType): Promise<Institution[]> {
    return institutionRepository.findByType(type);
  },

  async create(data: Prisma.InstitutionCreateInput): Promise<Institution> {
    return institutionRepository.create(data);
  },

  async update(id: string, data: Prisma.InstitutionUpdateInput): Promise<Institution> {
    return institutionRepository.update(id, data);
  },

  async delete(id: string): Promise<Institution> {
    return institutionRepository.delete(id);
  },

  async getSummary(): Promise<InstitutionSummary[]> {
    const institutions = await institutionRepository.findAll();
    const accounts = await accountRepository.findAll();

    const summaryMap = new Map<string, InstitutionSummary>();

    for (const inst of institutions) {
      summaryMap.set(inst.id, {
        institutionId: inst.id,
        institutionName: inst.name,
        institutionType: inst.type as InstitutionType,
        totalValue: 0,
        accountCount: 0,
      });
    }

    for (const account of accounts) {
      const summary = summaryMap.get(account.institutionId);
      if (summary) {
        const holdingsValue = await holdingRepository.getTotalValueByAccountId(account.id);
        summary.totalValue += account.cashBalance + holdingsValue;
        summary.accountCount += 1;
      }
    }

    return Array.from(summaryMap.values()).filter(s => s.accountCount > 0);
  },
};

// ============================================
// FamilyMember Service
// ============================================

export const familyMemberService = {
  async getAll(): Promise<FamilyMember[]> {
    return familyMemberRepository.findAll();
  },

  async getById(id: string): Promise<FamilyMember | null> {
    return familyMemberRepository.findById(id);
  },

  async getByName(name: string): Promise<FamilyMember | null> {
    return familyMemberRepository.findByName(name);
  },

  async create(data: Prisma.FamilyMemberCreateInput): Promise<FamilyMember> {
    return familyMemberRepository.create(data);
  },

  async update(id: string, data: Prisma.FamilyMemberUpdateInput): Promise<FamilyMember> {
    return familyMemberRepository.update(id, data);
  },

  async delete(id: string): Promise<FamilyMember> {
    return familyMemberRepository.delete(id);
  },

  async getSummary(): Promise<MemberAssetSummary[]> {
    const members = await familyMemberRepository.findAll();
    const summaries: MemberAssetSummary[] = [];

    for (const member of members) {
      const accounts = await accountRepository.findByMemberId(member.id);

      let totalCash = 0;
      let totalHoldings = 0;

      for (const account of accounts) {
        totalCash += account.cashBalance;
        totalHoldings += await holdingRepository.getTotalValueByAccountId(account.id);
      }

      summaries.push({
        memberId: member.id,
        memberName: member.name,
        memberColor: member.color,
        totalCash,
        totalHoldings,
        totalAssets: totalCash + totalHoldings,
        accountCount: accounts.length,
      });
    }

    return summaries;
  },
};

// ============================================
// Account Service
// ============================================

export const accountService = {
  async getAll() {
    return accountRepository.findAll();
  },

  async getById(id: string) {
    return accountRepository.findById(id);
  },

  async getByMemberId(memberId: string) {
    return accountRepository.findByMemberId(memberId);
  },

  async getByInstitutionId(institutionId: string) {
    return accountRepository.findByInstitutionId(institutionId);
  },

  async getByType(accountType: AccountType) {
    return accountRepository.findByType(accountType);
  },

  async create(data: Prisma.AccountCreateInput): Promise<Account> {
    return accountRepository.create(data);
  },

  async update(id: string, data: Prisma.AccountUpdateInput): Promise<Account> {
    return accountRepository.update(id, data);
  },

  async updateCashBalance(id: string, cashBalance: number): Promise<Account> {
    return accountRepository.updateCashBalance(id, cashBalance);
  },

  async delete(id: string): Promise<Account> {
    return accountRepository.delete(id);
  },

  async getTotalCashBalance(): Promise<number> {
    return accountRepository.getTotalCashBalance();
  },

  async getSummary(): Promise<AccountSummary[]> {
    const accounts = await accountRepository.findAll();
    const summaries: AccountSummary[] = [];

    for (const account of accounts) {
      const holdingsValue = await holdingRepository.getTotalValueByAccountId(account.id);

      summaries.push({
        accountId: account.id,
        accountName: account.name,
        accountType: account.accountType as AccountType,
        memberName: account.member.name,
        institutionName: account.institution.name,
        cashBalance: account.cashBalance,
        holdingsValue,
        totalValue: account.cashBalance + holdingsValue,
      });
    }

    return summaries;
  },

  async createSnapshot(accountId: string, date: Date): Promise<void> {
    const account = await accountRepository.findById(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const holdingsValue = await holdingRepository.getTotalValueByAccountId(accountId);
    const totalValue = account.cashBalance + holdingsValue;

    await accountSnapshotRepository.upsert(accountId, date, {
      cashBalance: account.cashBalance,
      holdingsValue,
      totalValue,
    });
  },

  async createSnapshotsForAllAccounts(date: Date): Promise<void> {
    const accounts = await accountRepository.findAll();

    for (const account of accounts) {
      await this.createSnapshot(account.id, date);
    }
  },

  async getSnapshots(accountId: string) {
    return accountSnapshotRepository.findByAccountId(accountId);
  },

  async getSnapshotsByDateRange(accountId: string, startDate: Date, endDate: Date) {
    return accountSnapshotRepository.findByAccountIdAndDateRange(accountId, startDate, endDate);
  },
};
