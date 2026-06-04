import { Calendar, PieChart, type LucideIcon } from 'lucide-react';

// Navigation
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/budget/monthly', label: '월별 요약', icon: Calendar },
  { href: '/asset', label: '자산 현황', icon: PieChart },
];

// Asset Sub Navigation
export interface AssetSubNavItem {
  href: string;
  label: string;
}

export const ASSET_SUB_NAV_ITEMS: AssetSubNavItem[] = [
  { href: '/asset/monthly', label: '월별 현황' },
  { href: '/asset/trend', label: '자산 추이' },
  { href: '/asset/portfolio', label: '포트폴리오 분석' },
  { href: '/asset/transactions', label: '자산 거래 상세' },
];

// Warm-tuned palette (matches design tokens: gain/accent/loss)
export const RISK_LEVEL_COLORS: Record<string, string> = {
  안전자산: '#3e9c6b', // gain
  중립자산: '#e07856', // accent coral
  위험자산: '#ce4b3c', // loss
};

export const RISK_LEVEL_TEXT_COLORS: Record<string, string> = {
  안전자산: 'text-gain',
  중립자산: 'text-accent',
  위험자산: 'text-loss',
};

export const RISK_LEVEL_CHILD_PALETTES: Record<string, string[]> = {
  안전자산: ['#2f7c54', '#3e9c6b', '#5fb285', '#8fcaa6', '#bfe0cd'],
  중립자산: ['#c9633f', '#e07856', '#ed9579', '#f3b5a0', '#f8d4c7'],
  위험자산: ['#a93b2e', '#ce4b3c', '#dd7264', '#e89e94', '#f2c8c1'],
};

export const DEFAULT_CHILD_COLORS = ['#8c8377', '#b4aba0', '#d9d1c3'];

// Account Type Categories
export const PENSION_ACCOUNT_TYPES = ['연금저축', 'IRP', 'ISA'] as const;

// Holding Transaction Type
export const HOLDING_TRANSACTION_TYPE_OPTIONS = [
  { value: 'buy', label: '매수' },
  { value: 'sell', label: '매도' },
  { value: 'dividend', label: '배당' },
  { value: 'transfer_in', label: '이체입고' },
  { value: 'transfer_out', label: '이체출고' },
] as const;

export const HOLDING_TRANSACTION_TYPE_LABELS: Record<string, string> = {
  buy: '매수',
  sell: '매도',
  dividend: '배당',
  transfer_in: '이체입고',
  transfer_out: '이체출고',
};

// Chart Colors
export const CHART_COLORS = {
  income: '#3e9c6b', // gain
  expense: '#ce4b3c', // loss
} as const;
