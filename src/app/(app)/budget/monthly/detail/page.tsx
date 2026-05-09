import { redirect } from 'next/navigation';

interface MonthlyDetailPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MonthlyDetailPage({ searchParams }: MonthlyDetailPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const params = new URLSearchParams({ view: 'detail' });
  const year = getSearchValue(resolvedSearchParams, 'year');
  const month = getSearchValue(resolvedSearchParams, 'month');

  if (year) params.set('year', year);
  if (month) params.set('month', month);

  redirect(`/budget/monthly?${params.toString()}`);
}
