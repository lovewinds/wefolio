import { holdingValueSnapshotService } from '@/services/holding-service';
import { AssetTrendView } from '@/components/features/asset';
import { computeAssetTrendRange } from '@/components/features/asset/asset-trend-range';

export const dynamic = 'force-dynamic';

interface AssetTrendPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseQueryNumber(value: string | undefined, min: number, max: number): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export default async function AssetTrendPage({ searchParams }: AssetTrendPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const now = new Date();
  const queryYear = parseQueryNumber(getSearchValue(resolvedSearchParams, 'year'), 2000, 9999);
  const queryMonth = parseQueryNumber(getSearchValue(resolvedSearchParams, 'month'), 1, 12);
  const endDate = {
    year: queryYear ?? now.getFullYear(),
    month: queryMonth ?? now.getMonth() + 1,
  };

  const defaultRange = computeAssetTrendRange(6, endDate, null);

  const [trendData, monthlyData] = await Promise.all([
    holdingValueSnapshotService.getAssetTrendData(
      defaultRange.startYear,
      defaultRange.startMonth,
      defaultRange.endYear,
      defaultRange.endMonth
    ),
    holdingValueSnapshotService.getMonthlyAssetData(endDate.year, endDate.month),
  ]);

  return (
    <AssetTrendView
      initialData={trendData}
      initialEndDate={endDate}
      availableRange={monthlyData.availableRange}
    />
  );
}
