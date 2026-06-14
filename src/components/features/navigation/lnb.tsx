'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useSyncExternalStore } from 'react';
import { Moon, PanelLeft, PanelLeftClose, Sun } from 'lucide-react';
import { ASSET_SUB_NAV_ITEMS, NAV_ITEMS, SETTINGS_NAV_ITEMS } from '@/lib/constants';

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

function useSidebarCollapsed() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getSnapshot = useCallback(() => localStorage.getItem('sidebar-collapsed') === '1', []);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function LNB() {
  const pathname = usePathname();
  const isDark = useTheme();
  const collapsed = useSidebarCollapsed();

  const toggleCollapsed = () => {
    const next = !collapsed;
    localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
    window.dispatchEvent(new Event('storage'));
  };

  const setTheme = (dark: boolean) => {
    if (dark) {
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
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sb-brand">
        <Image src="/brand/wefolio-mark.svg" alt="" width={30} height={30} priority />
        <span className="sb-wm">
          We<span>Folio</span>
        </span>
        <button
          type="button"
          className="sb-collapse"
          onClick={toggleCollapsed}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          aria-expanded={!collapsed}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? (
            <PanelLeft size={18} strokeWidth={1.75} suppressHydrationWarning />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.75} suppressHydrationWarning />
          )}
        </button>
      </div>

      <div className="sb-group">
        <div className="sb-group-label">메뉴</div>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`nav-item${isActive ? ' on' : ''}`}
                title={item.label}
              >
                <Icon size={18} strokeWidth={1.75} suppressHydrationWarning />
                <span className="nav-label">{item.label}</span>
              </Link>
              {item.href === '/asset' && isActive && (
                <div className="nav-subtree">
                  {ASSET_SUB_NAV_ITEMS.filter(subItem => subItem.href !== '/asset').map(subItem => {
                    const isSubActive =
                      pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
                    const SubIcon = subItem.icon;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`nav-sub-item${isSubActive ? ' on' : ''}`}
                        title={subItem.label}
                      >
                        <SubIcon size={16} strokeWidth={1.75} suppressHydrationWarning />
                        <span className="nav-label">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sb-group">
        <div className="sb-group-label">설정</div>
        {SETTINGS_NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive ? ' on' : ''}`}
              title={item.label}
            >
              <Icon size={18} strokeWidth={1.75} suppressHydrationWarning />
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="sb-foot">
        <div className="seg" style={{ marginBottom: 12, width: '100%' }}>
          <button
            type="button"
            className={!isDark ? 'on' : ''}
            onClick={() => setTheme(false)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Sun size={14} strokeWidth={1.75} suppressHydrationWarning />
            <span className="nav-label"> Light</span>
          </button>
          <button
            type="button"
            className={isDark ? 'on' : ''}
            onClick={() => setTheme(true)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Moon size={14} strokeWidth={1.75} suppressHydrationWarning />
            <span className="nav-label"> Dark</span>
          </button>
        </div>
        <div className="sb-house">
          <span className="ava">우리</span>
          <div>
            <div className="hn">우리 집</div>
            <div className="hs">지완 · 지아</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
