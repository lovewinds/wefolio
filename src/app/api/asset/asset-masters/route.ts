import { NextRequest, NextResponse } from 'next/server';
import { assetMasterService } from '@/services/holding-service';
import { createAssetMasterSchema } from '@/lib/validations/asset-master';

export async function GET() {
  try {
    const data = await assetMasterService.getAll();
    const mapped = data.map(a => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      assetClass: a.assetClass,
      riskLevel: a.riskLevel,
    }));
    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('AssetMasters GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset masters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAssetMasterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const assetMaster = await assetMasterService.create(parsed.data);
    return NextResponse.json({ success: true, data: assetMaster });
  } catch (error) {
    console.error('AssetMasters POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create asset master' },
      { status: 500 }
    );
  }
}
