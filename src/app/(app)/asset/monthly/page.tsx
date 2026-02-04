import { holdingValueSnapshotService } from '@/services/holding-service';
import { MonthlyAssetView } from '@/components/features/asset';

export const dynamic = 'force-dynamic';

export default async function AssetMonthlyPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const data = await holdingValueSnapshotService.getMonthlyAssetData(year, month);

  return <MonthlyAssetView initialData={data} initialYear={year} initialMonth={month} />;
}
