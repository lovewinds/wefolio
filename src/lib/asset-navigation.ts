export function buildAssetTabHref(href: string, year?: number, month?: number): string {
  if (!year || !month) return href;

  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });

  return `${href}?${params.toString()}`;
}
