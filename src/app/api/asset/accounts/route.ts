import { NextRequest, NextResponse } from 'next/server';
import { accountService } from '@/services/account-service';
import { createAccountSchema } from '@/lib/validations/account';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const institutionId = searchParams.get('institutionId');

    let data;
    if (institutionId) {
      data = await accountService.getByInstitutionId(institutionId);
    } else {
      data = await accountService.getAll();
    }

    const mapped = data.map(a => ({
      id: a.id,
      name: a.name,
      accountType: a.accountType,
      institutionId: a.institution.id,
      memberName: a.member.name,
      memberId: a.member.id,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Accounts GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, accountType, institutionId, memberId } = parsed.data;

    const account = await accountService.create({
      name,
      accountType,
      institution: { connect: { id: institutionId } },
      member: { connect: { id: memberId } },
    });

    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    console.error('Accounts POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
