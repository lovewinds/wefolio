import {
  institutionRepository,
  familyMemberRepository,
  accountRepository,
} from '@/repositories/account-repository';
import type { AssetInstitution, FamilyMember, Account, Prisma } from '@prisma/client';
import type { AssetInstitutionType, AccountType } from '@/types/asset';

// ============================================
// Institution Service
// ============================================

export const institutionService = {
  async getAll(): Promise<AssetInstitution[]> {
    return institutionRepository.findAll();
  },

  async getById(id: string): Promise<AssetInstitution | null> {
    return institutionRepository.findById(id);
  },

  async getByType(type: AssetInstitutionType): Promise<AssetInstitution[]> {
    return institutionRepository.findByType(type);
  },

  async create(data: Prisma.AssetInstitutionCreateInput): Promise<AssetInstitution> {
    return institutionRepository.create(data);
  },

  async update(id: string, data: Prisma.AssetInstitutionUpdateInput): Promise<AssetInstitution> {
    return institutionRepository.update(id, data);
  },

  async delete(id: string): Promise<AssetInstitution> {
    return institutionRepository.delete(id);
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
};
