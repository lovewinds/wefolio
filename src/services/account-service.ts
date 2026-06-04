import {
  institutionRepository,
  familyMemberRepository,
  accountRepository,
} from '@/repositories/account-repository';
import type { Institution, Member, Account, Prisma } from '@prisma/client';
import type { AssetInstitutionType, AccountType } from '@/types/asset';

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

  async getByType(type: AssetInstitutionType): Promise<Institution[]> {
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
};

// ============================================
// Member Service
// ============================================

export const familyMemberService = {
  async getAll(): Promise<Member[]> {
    return familyMemberRepository.findAll();
  },

  async getById(id: string): Promise<Member | null> {
    return familyMemberRepository.findById(id);
  },

  async getByName(name: string): Promise<Member | null> {
    return familyMemberRepository.findByName(name);
  },

  async create(data: Prisma.MemberCreateInput): Promise<Member> {
    return familyMemberRepository.create(data);
  },

  async update(id: string, data: Prisma.MemberUpdateInput): Promise<Member> {
    return familyMemberRepository.update(id, data);
  },

  async delete(id: string): Promise<Member> {
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

  async delete(id: string): Promise<Account> {
    return accountRepository.delete(id);
  },
};
