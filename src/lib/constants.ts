import { Calendar, CalendarRange, PieChart, type LucideIcon } from 'lucide-react';

// Navigation
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/summary/monthly', label: '월별 요약', icon: Calendar },
  { href: '/statistics/yearly', label: '연간 요약', icon: CalendarRange },
  { href: '/asset/monthly', label: '자산 현황', icon: PieChart },
];

// Risk Level
export const RISK_LEVEL_LABELS: Record<string, string> = {
  conservative: '안전자산',
  moderate: '중립자산',
  aggressive: '위험자산',
};

export const RISK_LEVEL_COLORS: Record<string, string> = {
  안전자산: '#22c55e',
  중립자산: '#3b82f6',
  위험자산: '#ef4444',
};

export const RISK_LEVEL_TEXT_COLORS: Record<string, string> = {
  안전자산: 'text-emerald-600 dark:text-emerald-400',
  중립자산: 'text-blue-600 dark:text-blue-400',
  위험자산: 'text-rose-600 dark:text-rose-400',
};

export const RISK_LEVEL_CHILD_PALETTES: Record<string, string[]> = {
  안전자산: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
  중립자산: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  위험자산: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'],
};

export const DEFAULT_CHILD_COLORS = ['#6b7280', '#9ca3af', '#d1d5db'];

// Chart Colors
export const CHART_COLORS = {
  income: '#10b981',
  expense: '#f43f5e',
} as const;
