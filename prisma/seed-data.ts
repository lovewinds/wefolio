// 시드 데이터 타입 정의
export interface SeedCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
  parentId?: string;
}

export interface SeedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string; // 소분류 이름 (소분류가 있는 경우)
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

// 대분류 카테고리
export const parentCategories: SeedCategory[] = [
  // 수입 대분류
  {
    id: 'income-regular',
    name: '정기수입',
    type: 'income',
    icon: '💰',
    color: '#10b981',
    isDefault: true,
  },
  {
    id: 'income-extra',
    name: '부가수입',
    type: 'income',
    icon: '💵',
    color: '#34d399',
    isDefault: true,
  },
  // 지출 대분류
  {
    id: 'expense-living',
    name: '생활비',
    type: 'expense',
    icon: '🏠',
    color: '#f43f5e',
    isDefault: true,
  },
  {
    id: 'expense-transport',
    name: '교통/차량',
    type: 'expense',
    icon: '🚗',
    color: '#f97316',
    isDefault: true,
  },
  {
    id: 'expense-food',
    name: '식비',
    type: 'expense',
    icon: '🍽️',
    color: '#fb7185',
    isDefault: true,
  },
  {
    id: 'expense-culture',
    name: '문화/여가',
    type: 'expense',
    icon: '🎬',
    color: '#a855f7',
    isDefault: true,
  },
  {
    id: 'expense-shopping',
    name: '쇼핑',
    type: 'expense',
    icon: '🛍️',
    color: '#ec4899',
    isDefault: true,
  },
  {
    id: 'expense-health',
    name: '건강/의료',
    type: 'expense',
    icon: '🏥',
    color: '#06b6d4',
    isDefault: true,
  },
  {
    id: 'expense-finance',
    name: '금융',
    type: 'expense',
    icon: '🏦',
    color: '#3b82f6',
    isDefault: true,
  },
  {
    id: 'expense-etc',
    name: '기타',
    type: 'expense',
    icon: '📝',
    color: '#71717a',
    isDefault: true,
  },
];

// 소분류 카테고리
export const childCategories: SeedCategory[] = [
  // 정기수입 소분류
  {
    id: 'income-salary',
    name: '급여',
    type: 'income',
    icon: '💼',
    color: '#10b981',
    isDefault: true,
    parentId: 'income-regular',
  },
  {
    id: 'income-bonus',
    name: '상여금',
    type: 'income',
    icon: '🎁',
    color: '#10b981',
    isDefault: true,
    parentId: 'income-regular',
  },
  // 부가수입 소분류
  {
    id: 'income-freelance',
    name: '부수입',
    type: 'income',
    icon: '💻',
    color: '#34d399',
    isDefault: true,
    parentId: 'income-extra',
  },
  {
    id: 'income-interest',
    name: '이자',
    type: 'income',
    icon: '📈',
    color: '#34d399',
    isDefault: true,
    parentId: 'income-extra',
  },
  {
    id: 'income-allowance',
    name: '용돈',
    type: 'income',
    icon: '🎀',
    color: '#34d399',
    isDefault: true,
    parentId: 'income-extra',
  },
  // 생활비 소분류
  {
    id: 'expense-rent',
    name: '월세/관리비',
    type: 'expense',
    icon: '🏢',
    color: '#f43f5e',
    isDefault: true,
    parentId: 'expense-living',
  },
  {
    id: 'expense-utility',
    name: '공과금',
    type: 'expense',
    icon: '💡',
    color: '#f43f5e',
    isDefault: true,
    parentId: 'expense-living',
  },
  {
    id: 'expense-telecom',
    name: '통신비',
    type: 'expense',
    icon: '📱',
    color: '#f43f5e',
    isDefault: true,
    parentId: 'expense-living',
  },
  // 교통/차량 소분류
  {
    id: 'expense-public-transport',
    name: '대중교통',
    type: 'expense',
    icon: '🚇',
    color: '#f97316',
    isDefault: true,
    parentId: 'expense-transport',
  },
  {
    id: 'expense-fuel',
    name: '주유비',
    type: 'expense',
    icon: '⛽',
    color: '#f97316',
    isDefault: true,
    parentId: 'expense-transport',
  },
  {
    id: 'expense-parking',
    name: '주차/통행료',
    type: 'expense',
    icon: '🅿️',
    color: '#f97316',
    isDefault: true,
    parentId: 'expense-transport',
  },
  // 식비 소분류
  {
    id: 'expense-grocery',
    name: '식료품',
    type: 'expense',
    icon: '🛒',
    color: '#fb7185',
    isDefault: true,
    parentId: 'expense-food',
  },
  {
    id: 'expense-dining',
    name: '외식',
    type: 'expense',
    icon: '🍜',
    color: '#fb7185',
    isDefault: true,
    parentId: 'expense-food',
  },
  {
    id: 'expense-cafe',
    name: '카페/음료',
    type: 'expense',
    icon: '☕',
    color: '#fb7185',
    isDefault: true,
    parentId: 'expense-food',
  },
  {
    id: 'expense-delivery',
    name: '배달',
    type: 'expense',
    icon: '🛵',
    color: '#fb7185',
    isDefault: true,
    parentId: 'expense-food',
  },
  // 문화/여가 소분류
  {
    id: 'expense-movie',
    name: '영화/공연',
    type: 'expense',
    icon: '🎭',
    color: '#a855f7',
    isDefault: true,
    parentId: 'expense-culture',
  },
  {
    id: 'expense-travel',
    name: '여행',
    type: 'expense',
    icon: '✈️',
    color: '#a855f7',
    isDefault: true,
    parentId: 'expense-culture',
  },
  {
    id: 'expense-hobby',
    name: '취미',
    type: 'expense',
    icon: '🎨',
    color: '#a855f7',
    isDefault: true,
    parentId: 'expense-culture',
  },
  {
    id: 'expense-subscription',
    name: '구독서비스',
    type: 'expense',
    icon: '📺',
    color: '#a855f7',
    isDefault: true,
    parentId: 'expense-culture',
  },
  // 쇼핑 소분류
  {
    id: 'expense-clothes',
    name: '의류',
    type: 'expense',
    icon: '👕',
    color: '#ec4899',
    isDefault: true,
    parentId: 'expense-shopping',
  },
  {
    id: 'expense-beauty',
    name: '미용',
    type: 'expense',
    icon: '💄',
    color: '#ec4899',
    isDefault: true,
    parentId: 'expense-shopping',
  },
  {
    id: 'expense-household',
    name: '생활용품',
    type: 'expense',
    icon: '🧴',
    color: '#ec4899',
    isDefault: true,
    parentId: 'expense-shopping',
  },
  // 건강/의료 소분류
  {
    id: 'expense-hospital',
    name: '병원',
    type: 'expense',
    icon: '🩺',
    color: '#06b6d4',
    isDefault: true,
    parentId: 'expense-health',
  },
  {
    id: 'expense-pharmacy',
    name: '약국',
    type: 'expense',
    icon: '💊',
    color: '#06b6d4',
    isDefault: true,
    parentId: 'expense-health',
  },
  {
    id: 'expense-fitness',
    name: '운동',
    type: 'expense',
    icon: '🏋️',
    color: '#06b6d4',
    isDefault: true,
    parentId: 'expense-health',
  },
  // 금융 소분류
  {
    id: 'expense-saving',
    name: '저축',
    type: 'expense',
    icon: '🐷',
    color: '#3b82f6',
    isDefault: true,
    parentId: 'expense-finance',
  },
  {
    id: 'expense-insurance',
    name: '보험',
    type: 'expense',
    icon: '🛡️',
    color: '#3b82f6',
    isDefault: true,
    parentId: 'expense-finance',
  },
  {
    id: 'expense-investment',
    name: '투자',
    type: 'expense',
    icon: '📊',
    color: '#3b82f6',
    isDefault: true,
    parentId: 'expense-finance',
  },
  // 기타 소분류
  {
    id: 'expense-event',
    name: '경조사',
    type: 'expense',
    icon: '💐',
    color: '#71717a',
    isDefault: true,
    parentId: 'expense-etc',
  },
  {
    id: 'expense-education',
    name: '교육',
    type: 'expense',
    icon: '📚',
    color: '#71717a',
    isDefault: true,
    parentId: 'expense-etc',
  },
  {
    id: 'expense-misc',
    name: '기타지출',
    type: 'expense',
    icon: '📦',
    color: '#71717a',
    isDefault: true,
    parentId: 'expense-etc',
  },
];

// 전체 카테고리 (대분류 + 소분류)
export const defaultCategories: SeedCategory[] = [...parentCategories, ...childCategories];

// Mock 거래 데이터 (2026년 1월) - 소분류 기준
const januaryTransactions: SeedTransaction[] = [
  // 수입
  {
    type: 'income',
    amount: 4500000,
    category: '급여',
    description: '1월 급여',
    date: createDate('20260110'),
  },
  {
    type: 'income',
    amount: 200000,
    category: '부수입',
    description: '프리랜서 작업',
    date: createDate('20260115'),
  },
  // 지출
  {
    type: 'expense',
    amount: 1200000,
    category: '월세/관리비',
    description: '월세',
    date: createDate('20260105'),
  },
  {
    type: 'expense',
    amount: 250000,
    category: '식료품',
    description: '마트 장보기',
    date: createDate('20260108'),
  },
  {
    type: 'expense',
    amount: 120000,
    category: '외식',
    description: '가족 외식',
    date: createDate('20260109'),
  },
  {
    type: 'expense',
    amount: 45000,
    category: '카페/음료',
    description: '커피',
    date: createDate('20260110'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '대중교통',
    description: '교통카드 충전',
    date: createDate('20260110'),
  },
  {
    type: 'expense',
    amount: 70000,
    category: '주유비',
    description: '주유',
    date: createDate('20260112'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '통신비',
    description: '핸드폰 요금',
    date: createDate('20260112'),
  },
  {
    type: 'expense',
    amount: 35000,
    category: '영화/공연',
    description: '영화 관람',
    date: createDate('20260114'),
  },
  {
    type: 'expense',
    amount: 15000,
    category: '구독서비스',
    description: '넷플릭스',
    date: createDate('20260115'),
  },
  {
    type: 'expense',
    amount: 180000,
    category: '의류',
    description: '겨울옷 구매',
    date: createDate('20260116'),
  },
  {
    type: 'expense',
    amount: 85000,
    category: '생활용품',
    description: '생활용품',
    date: createDate('20260117'),
  },
  {
    type: 'expense',
    amount: 120000,
    category: '병원',
    description: '병원 진료',
    date: createDate('20260118'),
  },
  {
    type: 'expense',
    amount: 300000,
    category: '저축',
    description: '적금 이체',
    date: createDate('20260120'),
  },
];

// Mock 거래 데이터 (2026년 2월)
const februaryTransactions: SeedTransaction[] = [
  // 수입
  {
    type: 'income',
    amount: 4500000,
    category: '급여',
    description: '2월 급여',
    date: createDate('20260210'),
  },
  {
    type: 'income',
    amount: 150000,
    category: '이자',
    description: '예금 이자',
    date: createDate('20260228'),
  },
  // 지출
  {
    type: 'expense',
    amount: 1200000,
    category: '월세/관리비',
    description: '월세',
    date: createDate('20260205'),
  },
  {
    type: 'expense',
    amount: 280000,
    category: '식료품',
    description: '마트 장보기',
    date: createDate('20260207'),
  },
  {
    type: 'expense',
    amount: 150000,
    category: '외식',
    description: '외식',
    date: createDate('20260208'),
  },
  {
    type: 'expense',
    amount: 55000,
    category: '배달',
    description: '배달음식',
    date: createDate('20260209'),
  },
  {
    type: 'expense',
    amount: 100000,
    category: '대중교통',
    description: '교통비',
    date: createDate('20260210'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '주유비',
    description: '주유',
    date: createDate('20260211'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '통신비',
    description: '핸드폰 요금',
    date: createDate('20260212'),
  },
  {
    type: 'expense',
    amount: 150000,
    category: '영화/공연',
    description: '콘서트 티켓',
    date: createDate('20260214'),
  },
  {
    type: 'expense',
    amount: 200000,
    category: '의류',
    description: '봄옷',
    date: createDate('20260218'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '미용',
    description: '헤어컷',
    date: createDate('20260219'),
  },
  {
    type: 'expense',
    amount: 300000,
    category: '저축',
    description: '적금 이체',
    date: createDate('20260220'),
  },
  {
    type: 'expense',
    amount: 50000,
    category: '경조사',
    description: '경조사비',
    date: createDate('20260225'),
  },
];

// Mock 거래 데이터 (2026년 3월)
const marchTransactions: SeedTransaction[] = [
  // 수입
  {
    type: 'income',
    amount: 4500000,
    category: '급여',
    description: '3월 급여',
    date: createDate('20260310'),
  },
  {
    type: 'income',
    amount: 300000,
    category: '부수입',
    description: '프리랜서 작업',
    date: createDate('20260320'),
  },
  {
    type: 'income',
    amount: 100000,
    category: '용돈',
    description: '부모님 용돈',
    date: createDate('20260315'),
  },
  // 지출
  {
    type: 'expense',
    amount: 1200000,
    category: '월세/관리비',
    description: '월세',
    date: createDate('20260305'),
  },
  {
    type: 'expense',
    amount: 150000,
    category: '공과금',
    description: '전기/가스/수도',
    date: createDate('20260306'),
  },
  {
    type: 'expense',
    amount: 260000,
    category: '식료품',
    description: '마트 장보기',
    date: createDate('20260308'),
  },
  {
    type: 'expense',
    amount: 130000,
    category: '외식',
    description: '외식',
    date: createDate('20260309'),
  },
  {
    type: 'expense',
    amount: 40000,
    category: '카페/음료',
    description: '커피',
    date: createDate('20260310'),
  },
  {
    type: 'expense',
    amount: 90000,
    category: '대중교통',
    description: '교통비',
    date: createDate('20260310'),
  },
  {
    type: 'expense',
    amount: 70000,
    category: '주유비',
    description: '주유',
    date: createDate('20260311'),
  },
  {
    type: 'expense',
    amount: 80000,
    category: '통신비',
    description: '핸드폰 요금',
    date: createDate('20260312'),
  },
  {
    type: 'expense',
    amount: 250000,
    category: '여행',
    description: '주말 여행',
    date: createDate('20260322'),
  },
  {
    type: 'expense',
    amount: 45000,
    category: '취미',
    description: '취미용품',
    date: createDate('20260315'),
  },
  {
    type: 'expense',
    amount: 220000,
    category: '의류',
    description: '봄옷 구매',
    date: createDate('20260316'),
  },
  {
    type: 'expense',
    amount: 85000,
    category: '병원',
    description: '건강검진',
    date: createDate('20260325'),
  },
  {
    type: 'expense',
    amount: 50000,
    category: '운동',
    description: '헬스장',
    date: createDate('20260320'),
  },
  {
    type: 'expense',
    amount: 300000,
    category: '저축',
    description: '적금 이체',
    date: createDate('20260320'),
  },
  {
    type: 'expense',
    amount: 100000,
    category: '교육',
    description: '온라인 강의',
    date: createDate('20260328'),
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
  {
    name: '월세',
    type: 'expense',
    amount: 1200000,
    category: '월세/관리비',
    description: '매월 5일',
  },
  { name: '통신비', type: 'expense', amount: 80000, category: '통신비', description: '매월 12일' },
  {
    name: '넷플릭스',
    type: 'expense',
    amount: 17000,
    category: '구독서비스',
    description: '매월 15일',
  },
  { name: '적금', type: 'expense', amount: 300000, category: '저축', description: '매월 20일' },
  { name: '헬스장', type: 'expense', amount: 50000, category: '운동', description: '매월 1일' },
];
