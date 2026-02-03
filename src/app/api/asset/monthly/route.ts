import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const RISK_LEVEL_LABELS: Record<string, string> = {
  conservative: '안전자산',
  moderate: '중립자산',
  aggressive: '위험자산',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');

    if (!yearStr || !monthStr) {
      return NextResponse.json(
        { success: false, error: 'year and month parameters are required' },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ success: false, error: 'Invalid year or month' }, { status: 400 });
    }

    // Query date: first day of the month
    const snapshotDate = new Date(Date.UTC(year, month - 1, 1));

    const snapshots = await prisma.holdingValueSnapshot.findMany({
      where: { date: snapshotDate },
      include: {
        holding: {
          include: {
            assetMaster: true,
            account: {
              include: {
                member: true,
                institution: true,
              },
            },
          },
        },
      },
    });

    // Available date range
    const [minSnapshot, maxSnapshot] = await Promise.all([
      prisma.holdingValueSnapshot.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      prisma.holdingValueSnapshot.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
    ]);

    const availableRange =
      minSnapshot && maxSnapshot
        ? {
            min: {
              year: minSnapshot.date.getUTCFullYear(),
              month: minSnapshot.date.getUTCMonth() + 1,
            },
            max: {
              year: maxSnapshot.date.getUTCFullYear(),
              month: maxSnapshot.date.getUTCMonth() + 1,
            },
          }
        : null;

    if (snapshots.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalValue: 0,
          byRiskLevel: [],
          holdings: [],
          availableRange,
        },
      });
    }

    const totalValue = snapshots.reduce((sum, s) => sum + s.totalValueKRW, 0);

    // Build holdings list
    const holdings = snapshots.map(s => {
      const { holding } = s;
      const { assetMaster, account } = holding;
      return {
        id: s.id,
        assetName: assetMaster.name,
        assetClass: assetMaster.assetClass,
        subClass: assetMaster.subClass,
        riskLevel: RISK_LEVEL_LABELS[assetMaster.riskLevel] ?? assetMaster.riskLevel,
        currency: assetMaster.currency,
        quantity: s.quantity,
        priceKRW: s.priceKRW,
        totalValueKRW: s.totalValueKRW,
        percentage: totalValue > 0 ? Math.round((s.totalValueKRW / totalValue) * 10000) / 100 : 0,
        memberName: account.member.name,
        accountName: account.name,
        institutionName: account.institution.name,
      };
    });

    // Group by risk level
    const riskGroupMap = new Map<string, { totalValue: number; children: Map<string, number> }>();

    for (const h of holdings) {
      const riskLevel = h.riskLevel;
      if (!riskGroupMap.has(riskLevel)) {
        riskGroupMap.set(riskLevel, { totalValue: 0, children: new Map() });
      }
      const group = riskGroupMap.get(riskLevel)!;
      group.totalValue += h.totalValueKRW;

      // Use subClass if available, otherwise assetClass
      const childLabel = h.subClass ?? h.assetClass;
      group.children.set(childLabel, (group.children.get(childLabel) ?? 0) + h.totalValueKRW);
    }

    const byRiskLevel = Array.from(riskGroupMap.entries())
      .map(([riskLevel, group]) => ({
        riskLevel,
        totalValue: group.totalValue,
        percentage: totalValue > 0 ? Math.round((group.totalValue / totalValue) * 10000) / 100 : 0,
        children: Array.from(group.children.entries())
          .map(([label, value]) => ({
            label,
            value,
            percentage: totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : 0,
          }))
          .sort((a, b) => b.value - a.value),
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json({
      success: true,
      data: {
        totalValue,
        byRiskLevel,
        holdings,
        availableRange,
      },
    });
  } catch (error) {
    console.error('Asset Monthly API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset data' },
      { status: 500 }
    );
  }
}
