import { NextResponse } from 'next/server';
import { familyMemberService } from '@/services/account-service';

export async function GET() {
  try {
    const data = await familyMemberService.getAll();
    const mapped = data.map(m => ({
      id: m.id,
      name: m.name,
    }));
    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Members GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch members' }, { status: 500 });
  }
}
