import { NextRequest, NextResponse } from 'next/server';
import { institutionService } from '@/services/account-service';
import { createInstitutionSchema } from '@/lib/validations/institution';

export async function GET() {
  try {
    const data = await institutionService.getAll();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Institutions GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createInstitutionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const institution = await institutionService.create(parsed.data);
    return NextResponse.json({ success: true, data: institution });
  } catch (error) {
    console.error('Institutions POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create institution' },
      { status: 500 }
    );
  }
}
