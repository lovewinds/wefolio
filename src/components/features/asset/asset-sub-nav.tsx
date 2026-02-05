'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ASSET_SUB_NAV_ITEMS } from '@/lib/constants';

export function AssetSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
      {ASSET_SUB_NAV_ITEMS.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
