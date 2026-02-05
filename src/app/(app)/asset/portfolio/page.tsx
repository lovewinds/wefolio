import { holdingValueSnapshotService } from '@/services/holding-service';
import { PortfolioAnalysisView } from '@/components/features/asset';

export const dynamic = 'force-dynamic';

export default async function AssetPortfolioPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const data = await holdingValueSnapshotService.getMonthlyAssetData(year, month);

  return <PortfolioAnalysisView initialData={data} initialYear={year} initialMonth={month} />;
}
