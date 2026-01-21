'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CalendarRange, type LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/', label: '월별 요약', icon: Calendar },
  { href: '/statistics/yearly', label: '연간 요약', icon: CalendarRange },
];

export function LNB() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-full flex-col items-center">
        <header className="flex h-16 w-full items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">W</h1>
        </header>

        <nav className="flex-1 py-4">
          <ul className="space-y-2">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.5} />
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
