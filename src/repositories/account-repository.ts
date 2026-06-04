import { prisma } from '@/lib/prisma';
import type { Account, Institution, Member, Prisma } from '@prisma/client';

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
// Member Repository
// ============================================

export const familyMemberRepository = {
  async findAll(): Promise<Member[]> {
    return prisma.member.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string): Promise<Member | null> {
    return prisma.member.findUnique({
      where: { id },
    });
  },

  async findByName(name: string): Promise<Member | null> {
    return prisma.member.findUnique({
      where: { name },
    });
  },

  async create(data: Prisma.MemberCreateInput): Promise<Member> {
    return prisma.member.create({ data });
  },

  async update(id: string, data: Prisma.MemberUpdateInput): Promise<Member> {
    return prisma.member.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<Member> {
    return prisma.member.update({
      where: { id },
      data: { isActive: false },
    });
  },
};

// ============================================
// Account Repository
// ============================================

type AccountWithRelations = Account & {
  member: Member;
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

  async delete(id: string): Promise<Account> {
    return prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
