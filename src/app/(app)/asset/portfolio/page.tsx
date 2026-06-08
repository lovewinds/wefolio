import { holdingValueSnapshotService } from '@/services/holding-service';
import { PortfolioAnalysisView } from '@/components/features/asset';

export const dynamic = 'force-dynamic';

interface AssetPortfolioPageProps {
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

export default async function AssetPortfolioPage({ searchParams }: AssetPortfolioPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const now = new Date();
  const queryYear = parseQueryNumber(getSearchValue(resolvedSearchParams, 'year'), 2000, 9999);
  const queryMonth = parseQueryNumber(getSearchValue(resolvedSearchParams, 'month'), 1, 12);
  const year = queryYear ?? now.getFullYear();
  const month = queryMonth ?? now.getMonth() + 1;

  const data = await holdingValueSnapshotService.getMonthlyAssetData(year, month);

  return <PortfolioAnalysisView initialData={data} initialYear={year} initialMonth={month} />;
}
