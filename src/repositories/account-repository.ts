import { prisma } from '@/lib/prisma';
import type { Account, AccountSnapshot, Institution, FamilyMember, Prisma } from '@prisma/client';

// ============================================
// Institution Repository
// ============================================

export const institutionRepository = {
  async findAll(): Promise<Institution[]> {
    return prisma.institution.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string): Promise<Institution | null> {
    return prisma.institution.findUnique({
      where: { id },
    });
  },

  async findByName(name: string): Promise<Institution | null> {
    return prisma.institution.findUnique({
      where: { name },
    });
  },

  async findByType(type: string): Promise<Institution[]> {
    return prisma.institution.findMany({
      where: { type, isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async create(data: Prisma.InstitutionCreateInput): Promise<Institution> {
    return prisma.institution.create({ data });
  },

  async update(id: string, data: Prisma.InstitutionUpdateInput): Promise<Institution> {
    return prisma.institution.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<Institution> {
    return prisma.institution.update({
      where: { id },
      data: { isActive: false },
    });
  },
};

// ============================================
// FamilyMember Repository
// ============================================

export const familyMemberRepository = {
  async findAll(): Promise<FamilyMember[]> {
    return prisma.familyMember.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string): Promise<FamilyMember | null> {
    return prisma.familyMember.findUnique({
      where: { id },
    });
  },

  async findByName(name: string): Promise<FamilyMember | null> {
    return prisma.familyMember.findUnique({
      where: { name },
    });
  },

  async create(data: Prisma.FamilyMemberCreateInput): Promise<FamilyMember> {
    return prisma.familyMember.create({ data });
  },

  async update(id: string, data: Prisma.FamilyMemberUpdateInput): Promise<FamilyMember> {
    return prisma.familyMember.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<FamilyMember> {
    return prisma.familyMember.update({
      where: { id },
      data: { isActive: false },
    });
  },
};

// ============================================
// Account Repository
// ============================================

type AccountWithRelations = Account & {
  member: FamilyMember;
  institution: Institution;
};

export const accountRepository = {
  async findAll(): Promise<AccountWithRelations[]> {
    return prisma.account.findMany({
      where: { isActive: true },
      include: {
        member: true,
        institution: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string): Promise<AccountWithRelations | null> {
    return prisma.account.findUnique({
      where: { id },
      include: {
        member: true,
        institution: true,
      },
    });
  },

  async findByMemberId(memberId: string): Promise<AccountWithRelations[]> {
    return prisma.account.findMany({
      where: { memberId, isActive: true },
      include: {
        member: true,
        institution: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  async findByInstitutionId(institutionId: string): Promise<AccountWithRelations[]> {
    return prisma.account.findMany({
      where: { institutionId, isActive: true },
      include: {
        member: true,
        institution: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  async findByType(accountType: string): Promise<AccountWithRelations[]> {
    return prisma.account.findMany({
      where: { accountType, isActive: true },
      include: {
        member: true,
        institution: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  async create(data: Prisma.AccountCreateInput): Promise<Account> {
    return prisma.account.create({ data });
  },

  async update(id: string, data: Prisma.AccountUpdateInput): Promise<Account> {
    return prisma.account.update({
      where: { id },
      data,
    });
  },

  async updateCashBalance(id: string, cashBalance: number): Promise<Account> {
    return prisma.account.update({
      where: { id },
      data: { cashBalance },
    });
  },

  async delete(id: string): Promise<Account> {
    return prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async getTotalCashBalance(): Promise<number> {
    const result = await prisma.account.aggregate({
      where: { isActive: true },
      _sum: { cashBalance: true },
    });
    return result._sum.cashBalance ?? 0;
  },

  async getTotalCashBalanceByMember(memberId: string): Promise<number> {
    const result = await prisma.account.aggregate({
      where: { memberId, isActive: true },
      _sum: { cashBalance: true },
    });
    return result._sum.cashBalance ?? 0;
  },
};

// ============================================
// AccountSnapshot Repository
// ============================================

export const accountSnapshotRepository = {
  async findByAccountId(accountId: string): Promise<AccountSnapshot[]> {
    return prisma.accountSnapshot.findMany({
      where: { accountId },
      orderBy: { date: 'desc' },
    });
  },

  async findByAccountIdAndDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccountSnapshot[]> {
    return prisma.accountSnapshot.findMany({
      where: {
        accountId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  },

  async findByDate(date: Date): Promise<AccountSnapshot[]> {
    return prisma.accountSnapshot.findMany({
      where: { date },
      orderBy: { accountId: 'asc' },
    });
  },

  async findLatestByAccountId(accountId: string): Promise<AccountSnapshot | null> {
    return prisma.accountSnapshot.findFirst({
      where: { accountId },
      orderBy: { date: 'desc' },
    });
  },

  async create(data: Prisma.AccountSnapshotCreateInput): Promise<AccountSnapshot> {
    return prisma.accountSnapshot.create({ data });
  },

  async upsert(
    accountId: string,
    date: Date,
    data: {
      cashBalance: number;
      holdingsValue: number;
      totalValue: number;
    }
  ): Promise<AccountSnapshot> {
    return prisma.accountSnapshot.upsert({
      where: {
        accountId_date: { accountId, date },
      },
      update: data,
      create: {
        account: { connect: { id: accountId } },
        date,
        ...data,
      },
    });
  },

  async delete(id: string): Promise<AccountSnapshot> {
    return prisma.accountSnapshot.delete({
      where: { id },
    });
  },
};
