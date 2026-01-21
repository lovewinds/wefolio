'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', label: '월별 요약' },
  { href: '/statistics/yearly', label: '연간 요약' },
];

export function LNB() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-full flex-col">
        <header className="border-b border-zinc-200 px-6 py-6 dark:border-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">WeFolio</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">가족의 자산 포트폴리오</p>
        </header>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
