'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ASSET_SUB_NAV_ITEMS } from '@/lib/constants';
import { buildAssetTabHref } from '@/lib/asset-navigation';

interface AssetSubNavProps {
  year?: number;
  month?: number;
}

export function AssetSubNav({ year, month }: AssetSubNavProps) {
  const pathname = usePathname();

  return (
    <nav className="toggle">
      {ASSET_SUB_NAV_ITEMS.map(item => {
        const isActive =
          item.href === '/asset'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={buildAssetTabHref(item.href, year, month)}
            className={isActive ? 'on' : ''}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
