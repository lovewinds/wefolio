// 기본 카테고리 데이터
export const defaultCategories = [
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

// Mock 거래 데이터 (이번 달)
export const mockTransactions = [
  // 수입
  { type: 'income', amount: 4500000, category: '급여', description: '1월 급여', daysAgo: 10 },
  { type: 'income', amount: 200000, category: '부수입', description: '프리랜서 작업', daysAgo: 5 },
  // 지출
  { type: 'expense', amount: 1200000, category: '주거비', description: '월세', daysAgo: 15 },
  { type: 'expense', amount: 450000, category: '식비', description: '식료품 및 외식', daysAgo: 12 },
  {
    type: 'expense',
    amount: 150000,
    category: '교통비',
    description: '대중교통 및 주유',
    daysAgo: 10,
  },
  { type: 'expense', amount: 80000, category: '통신비', description: '핸드폰 요금', daysAgo: 8 },
  { type: 'expense', amount: 200000, category: '문화생활', description: '영화, 공연', daysAgo: 6 },
  { type: 'expense', amount: 350000, category: '쇼핑', description: '의류 구매', daysAgo: 4 },
  { type: 'expense', amount: 120000, category: '의료비', description: '병원 진료', daysAgo: 2 },
  { type: 'expense', amount: 300000, category: '저축', description: '적금 이체', daysAgo: 0 },
];

// Mock 자산 데이터
export const mockAssets = [
  { name: '주거래 통장', type: 'bank', balance: 5200000, note: '급여 통장' },
  { name: '비상금 통장', type: 'bank', balance: 3000000, note: '비상 자금' },
  { name: '현금', type: 'cash', balance: 150000, note: '지갑' },
  { name: '주식 계좌', type: 'investment', balance: 8500000, note: '국내 주식' },
  { name: '적금', type: 'bank', balance: 12000000, note: '만기 2026.12' },
];

// Mock 고정 지출 템플릿
export const mockRecurringTemplates = [
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
