'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ASSET_SUB_NAV_ITEMS } from '@/lib/constants';

export function AssetSubNav() {
  const pathname = usePathname();

  return (
    <nav className="toggle">
      {ASSET_SUB_NAV_ITEMS.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={isActive ? 'on' : ''}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
