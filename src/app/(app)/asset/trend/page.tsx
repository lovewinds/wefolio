import { holdingValueSnapshotService } from '@/services/holding-service';
import { AssetTrendView } from '@/components/features/asset';

export const dynamic = 'force-dynamic';

export default async function AssetTrendPage() {
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;

  // Default: 6 months
  let startYear = endYear;
  let startMonth = endMonth - 5;
  if (startMonth < 1) {
    startMonth += 12;
    startYear--;
  }

  const [trendData, monthlyData] = await Promise.all([
    holdingValueSnapshotService.getAssetTrendData(startYear, startMonth, endYear, endMonth),
    holdingValueSnapshotService.getMonthlyAssetData(endYear, endMonth),
  ]);

  return <AssetTrendView initialData={trendData} availableRange={monthlyData.availableRange} />;
}
