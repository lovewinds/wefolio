// 시드 데이터 타입 정의
export interface SeedCategory {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface SeedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export interface SeedAsset {
  name: string;
  type: 'cash' | 'bank' | 'investment' | 'property' | 'other';
  balance: number;
  note: string;
}

export interface SeedRecurringTemplate {
  name: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
}

// 날짜 생성 헬퍼 (YYYYMMDD 형태 지원)
function createDate(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  return new Date(year, month, day);
}

// 기본 카테고리 데이터
export const defaultCategories: SeedCategory[] = [
  // 수입 카테고리
  { name: '급여', type: 'income', icon: '💰', color: '#10b981', isDefault: true },
  { name: '부수입', type: 'income', icon: '💵', color: '#34d399', isDefault: true },
  { name: '이자', type: 'income', icon: '🏦', color: '#6ee7b7', isDefault: true },
  { name: '용돈', type: 'income', icon: '🎁', color: '#a7f3d0', isDefault: true },
  // 지출 카테고리
  { name: '주거비', type: 'expense', icon: '🏠', color: '#f43f5e', isDefault: true },
  { name: '식비', type: 'expense', icon: '🍽️', color: '#fb7185', isDefault: true },
  { name: '교통비', type: 'expense', icon: '🚗', color: '#fda4af', isDefault: true },
  { name: '통신비', type: 'expense', icon: '📱', color: '#f97316', isDefault: true },
  { name: '문화생활', type: 'expense', icon: '🎬', color: '#fb923c', isDefault: true },
  { name: '쇼핑', type: 'expense', icon: '🛍️', color: '#a855f7', isDefault: true },
  { name: '의료비', type: 'expense', icon: '🏥', color: '#c084fc', isDefault: true },
  { name: '저축', type: 'expense', icon: '🐷', color: '#3b82f6', isDefault: true },
  { name: '기타', type: 'expense', icon: '📝', color: '#71717a', isDefault: true },
];

// Mock 거래 데이터 (2025년 1월)
const januaryTransactions: SeedTransaction[] = [
  // 수입
  {
    type: 'income',
    amount: 4500000,
    category: '급여',
    description: '1월 급여',
    date: createDate('20250110'),
  },
  {
    type: 'income',
    amount: 200000,
    category: '부수입',
    description: '프리랜서 작업',
    date: createDate('20250115'),
  },
  // 지출
  {
    type: 'expense',
    amount: 1200000,
    category: '주거비',
    description: '월세',
    date: createDate('20250105'),
  },
  {
    type: 'expense',
    amount: 450000,
    category: '식비',
    description: '식료품 및 외식',
    date: createDate('20250108'),
  },
  {
    type: 'expense',
    amount: 150000,
    category: '교통비',
    description: '대중교통 및 주유',
    date: createDate('20250110'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '통신비',
    description: '핸드폰 요금',
    date: createDate('20250112'),
  },
  {
    type: 'expense',
    amount: 200000,
    category: '문화생활',
    description: '영화, 공연',
    date: createDate('20250114'),
  },
  {
    type: 'expense',
    amount: 350000,
    category: '쇼핑',
    description: '의류 구매',
    date: createDate('20250116'),
  },
  {
    type: 'expense',
    amount: 120000,
    category: '의료비',
    description: '병원 진료',
    date: createDate('20250118'),
  },
  {
    type: 'expense',
    amount: 300000,
    category: '저축',
    description: '적금 이체',
    date: createDate('20250120'),
  },
];

// Mock 거래 데이터 (2025년 2월)
const februaryTransactions: SeedTransaction[] = [
  // 수입
  {
    type: 'income',
    amount: 4500000,
    category: '급여',
    description: '2월 급여',
    date: createDate('20250210'),
  },
  {
    type: 'income',
    amount: 150000,
    category: '이자',
    description: '예금 이자',
    date: createDate('20250228'),
  },
  // 지출
  {
    type: 'expense',
    amount: 1200000,
    category: '주거비',
    description: '월세',
    date: createDate('20250205'),
  },
  {
    type: 'expense',
    amount: 520000,
    category: '식비',
    description: '식료품 및 외식',
    date: createDate('20250207'),
  },
  {
    type: 'expense',
    amount: 180000,
    category: '교통비',
    description: '대중교통 및 주유',
    date: createDate('20250210'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '통신비',
    description: '핸드폰 요금',
    date: createDate('20250212'),
  },
  {
    type: 'expense',
    amount: 150000,
    category: '문화생활',
    description: '콘서트 티켓',
    date: createDate('20250214'),
  },
  {
    type: 'expense',
    amount: 280000,
    category: '쇼핑',
    description: '생활용품',
    date: createDate('20250218'),
  },
  {
    type: 'expense',
    amount: 300000,
    category: '저축',
    description: '적금 이체',
    date: createDate('20250220'),
  },
  {
    type: 'expense',
    amount: 50000,
    category: '기타',
    description: '경조사비',
    date: createDate('20250225'),
  },
];

// Mock 거래 데이터 (2025년 3월)
const marchTransactions: SeedTransaction[] = [
  // 수입
  {
    type: 'income',
    amount: 4500000,
    category: '급여',
    description: '3월 급여',
    date: createDate('20250310'),
  },
  {
    type: 'income',
    amount: 300000,
    category: '부수입',
    description: '프리랜서 작업',
    date: createDate('20250320'),
  },
  {
    type: 'income',
    amount: 100000,
    category: '용돈',
    description: '부모님 용돈',
    date: createDate('20250315'),
  },
  // 지출
  {
    type: 'expense',
    amount: 1200000,
    category: '주거비',
    description: '월세',
    date: createDate('20250305'),
  },
  {
    type: 'expense',
    amount: 480000,
    category: '식비',
    description: '식료품 및 외식',
    date: createDate('20250308'),
  },
  {
    type: 'expense',
    amount: 160000,
    category: '교통비',
    description: '대중교통 및 주유',
    date: createDate('20250310'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '통신비',
    description: '핸드폰 요금',
    date: createDate('20250312'),
  },
  {
    type: 'expense',
    amount: 250000,
    category: '문화생활',
    description: '여행 경비',
    date: createDate('20250322'),
  },
  {
    type: 'expense',
    amount: 420000,
    category: '쇼핑',
    description: '봄옷 구매',
    date: createDate('20250316'),
  },
  {
    type: 'expense',
    amount: 85000,
    category: '의료비',
    description: '건강검진',
    date: createDate('20250325'),
  },
  {
    type: 'expense',
    amount: 300000,
    category: '저축',
    description: '적금 이체',
    date: createDate('20250320'),
  },
];

// 월별 데이터 통합
export const mockTransactions: SeedTransaction[] = [
  ...januaryTransactions,
  ...februaryTransactions,
  ...marchTransactions,
];

// Mock 자산 데이터
export const mockAssets: SeedAsset[] = [
  { name: '주거래 통장', type: 'bank', balance: 5200000, note: '급여 통장' },
  { name: '비상금 통장', type: 'bank', balance: 3000000, note: '비상 자금' },
  { name: '현금', type: 'cash', balance: 150000, note: '지갑' },
  { name: '주식 계좌', type: 'investment', balance: 8500000, note: '국내 주식' },
  { name: '적금', type: 'bank', balance: 12000000, note: '만기 2026.12' },
];

// Mock 고정 지출 템플릿
export const mockRecurringTemplates: SeedRecurringTemplate[] = [
  { name: '월세', type: 'expense', amount: 1200000, category: '주거비', description: '매월 5일' },
  { name: '통신비', type: 'expense', amount: 80000, category: '통신비', description: '매월 12일' },
  {
    name: '넷플릭스',
    type: 'expense',
    amount: 17000,
    category: '문화생활',
    description: '매월 15일',
  },
  { name: '적금', type: 'expense', amount: 300000, category: '저축', description: '매월 20일' },
];
