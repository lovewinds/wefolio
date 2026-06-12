import { describe, expect, it } from 'vitest';
import { ASSET_SUB_NAV_ITEMS, NAV_ITEMS } from '@/lib/constants';
import { buildAssetTabHref } from '@/lib/asset-navigation';

describe('asset navigation', () => {
  it('uses the requested asset tab order and labels', () => {
    expect(NAV_ITEMS.find(item => item.href === '/asset')?.label).toBe('자산');
    expect(ASSET_SUB_NAV_ITEMS).toEqual([
      { href: '/asset', label: '자산' },
      { href: '/asset/monthly', label: '월별 현황' },
      { href: '/asset/profit', label: '투자 수익' },
      { href: '/asset/detail', label: '자산 상세' },
      { href: '/asset/trend', label: '자산 추이' },
      { href: '/asset/portfolio', label: '포트폴리오' },
    ]);
  });

  it('keeps the selected month when linking between asset tabs', () => {
    expect(buildAssetTabHref('/asset/detail', 2026, 6)).toBe('/asset/detail?year=2026&month=6');
    expect(buildAssetTabHref('/asset', 2026, 6)).toBe('/asset?year=2026&month=6');
  });
});
