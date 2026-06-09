import { holdingValueSnapshotService } from '@/services/holding-service';
import { AssetOverviewView } from '@/components/features/asset';
import { computeAssetTrendRange } from '@/components/features/asset/asset-trend-range';

export const dynamic = 'force-dynamic';

const SPARKLINE_MONTHS = 7;

interface AssetOverviewPageProps {
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

export default async function AssetOverviewPage({ searchParams }: AssetOverviewPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const now = new Date();
  const queryYear = parseQueryNumber(getSearchValue(resolvedSearchParams, 'year'), 2000, 9999);
  const queryMonth = parseQueryNumber(getSearchValue(resolvedSearchParams, 'month'), 1, 12);
  const year = queryYear ?? now.getFullYear();
  const month = queryMonth ?? now.getMonth() + 1;

  const data = await holdingValueSnapshotService.getMonthlyAssetDataWithDelta(year, month);

  const range = computeAssetTrendRange(SPARKLINE_MONTHS, { year, month }, data.availableRange);
  const { trend } = await holdingValueSnapshotService.getAssetTrendData(
    range.startYear,
    range.startMonth,
    range.endYear,
    range.endMonth
  );

  return (
    <AssetOverviewView
      initialData={data}
      initialSparkline={trend}
      initialYear={year}
      initialMonth={month}
    />
  );
}
