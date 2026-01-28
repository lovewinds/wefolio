'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useSyncExternalStore } from 'react';
import { Calendar, CalendarRange, Moon, Sun, type LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/summary/monthly', label: '월별 요약', icon: Calendar },
  { href: '/statistics/yearly', label: '연간 요약', icon: CalendarRange },
];

function useTheme() {
  const subscribe = useCallback((callback: () => void) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', callback);
    window.addEventListener('storage', callback);
    return () => {
      mediaQuery.removeEventListener('change', callback);
      window.removeEventListener('storage', callback);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function LNB() {
  const pathname = usePathname();
  const isDark = useTheme();

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-full flex-col items-center">
        <header className="flex h-16 w-full items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">W</h1>
        </header>

        <nav className="flex-1 py-4">
          <ul className="space-y-2">
            {navItems.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                    <Icon size={20} strokeWidth={1.5} suppressHydrationWarning />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <footer className="pb-4">
          <button
            onClick={toggleDarkMode}
            title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            {isDark ? (
              <Sun size={20} strokeWidth={1.5} suppressHydrationWarning />
            ) : (
              <Moon size={20} strokeWidth={1.5} suppressHydrationWarning />
            )}
          </button>
        </footer>
      </div>
    </aside>
  );
}
