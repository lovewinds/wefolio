import { dashboardService } from '@/services/dashboard-service';
import { MonthlySummaryView } from '@/components/features/summary';

export const dynamic = 'force-dynamic';

export default async function MonthlySummaryPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const data = await dashboardService.getMonthlyData(year, month);

  return <MonthlySummaryView initialData={data} initialYear={year} initialMonth={month} />;
}
