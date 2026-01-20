# WeFolio 개발 로드맵

## 현재 상태

**구현 완료:**
- Prisma 스키마 (Transaction, Category, RecurringTemplate, Asset)
- Repository/Service 레이어 (CRUD 및 기본 통계)
- 홈페이지 대시보드 (요약 카드, 차트, 최근 거래)

**미구현:**
- API Routes
- /transactions, /assets, /statistics 페이지
- 재사용 UI 컴포넌트

---

## Phase 1: 데이터 기반 인프라 구축

### 목표
API Routes를 구현하고 주별/월별/기간별 데이터 조회 기능을 확장하여
프론트엔드-백엔드 연동 기반을 마련한다.

### 세부 기능

**1.1 API Routes 구현**
- `GET/POST /api/transactions` - 거래 목록 조회, 생성
- `GET/PUT/DELETE /api/transactions/[id]` - 개별 거래 조회, 수정, 삭제
- `GET/POST /api/categories` - 카테고리 관리
- `GET/POST /api/assets` - 자산 관리
- `GET/POST /api/templates` - 반복 템플릿 관리
- `GET /api/statistics/monthly` - 월별 통계
- `GET /api/statistics/weekly` - 주별 통계
- `GET /api/statistics/category` - 카테고리별 분석

**1.2 서비스 레이어 확장**
- `transactionService.getByWeek(year, week)` - 주별 거래 조회
- `transactionService.getByDateRange(start, end)` - 기간별 조회
- `statisticsService.getWeeklySummary()` - 주별 요약
- `statisticsService.getDailyTrend()` - 일별 추이

**1.3 유틸리티 및 시드 데이터**
- `src/lib/date-utils.ts` - 주차 계산, 날짜 범위 유틸리티
- `src/lib/api-response.ts` - 통일된 API 응답 포맷
- 시드 데이터 3개월치로 확장 (주별/월별 비교 가능)

### 생성 파일
```
src/app/api/
├── transactions/route.ts, [id]/route.ts
├── categories/route.ts, [id]/route.ts
├── assets/route.ts, [id]/route.ts
├── templates/route.ts, [id]/route.ts
└── statistics/monthly/route.ts, weekly/route.ts, category/route.ts
src/lib/date-utils.ts
src/lib/api-response.ts
```

---

## Phase 2: 거래 관리 UI

### 목표
사용자가 수입/지출을 직접 입력, 수정, 삭제할 수 있는 `/transactions` 페이지를 구현한다.
반복 지출 템플릿을 통한 빠른 입력 기능을 제공한다.

### 세부 기능

**2.1 공통 UI 컴포넌트**
- Button, Input, Select, Modal, Card
- DatePicker, Toast, ConfirmDialog
- Navigation (사이드바 또는 탑바)

**2.2 거래 목록 페이지 (`/transactions`)**
- 거래 목록 테이블/카드 뷰
- 필터링 (기간, 유형, 카테고리)
- 정렬 (날짜, 금액)
- 페이지네이션 또는 무한 스크롤

**2.3 거래 CRUD**
- 새 거래 추가 모달/폼
- 거래 수정 모달/폼
- 거래 삭제 확인 다이얼로그

**2.4 템플릿 기능**
- 템플릿 목록 표시 (즐겨찾기)
- 템플릿 클릭 → 즉시 거래 생성
- 템플릿 관리 (추가/수정/삭제)

**2.5 카테고리 관리**
- 사용자 정의 카테고리 추가
- 카테고리 편집/삭제

### 생성 파일
```
src/components/ui/ (button, input, select, modal, card, date-picker, toast)
src/components/layout/ (navigation, sidebar, header)
src/components/features/transactions/ (list, item, form, filters)
src/components/features/templates/ (list, item, form)
src/app/transactions/page.tsx
src/app/templates/page.tsx (선택)
src/hooks/use-transactions.ts, use-templates.ts
```

---

## Phase 3: 데이터 분석 UI

### 목표
주별, 월별, 카테고리별 등 다양한 관점에서 수입/지출을 분석할 수 있는
`/statistics` 페이지를 구현한다.

### 세부 기능

**3.1 기간 선택**
- 주/월/연 단위 선택
- 커스텀 기간 선택 (시작일~종료일)

**3.2 요약 정보**
- 선택 기간의 총 수입, 총 지출, 잔액
- 전월/전주 대비 증감률 표시

**3.3 차트**
- 카테고리별 지출 (Pie Chart) - 도넛 형태
- 수입 vs 지출 추이 (Line Chart) - 월별/주별
- 일별 지출 막대 (Bar Chart)
- 일별 지출 히트맵 (Calendar Heatmap) - @nivo/calendar 추가

**3.4 상세 분석**
- 특정 카테고리 클릭 → 해당 카테고리 상세 거래 목록
- 기간별 비교 기능

**3.5 내보내기**
- CSV 파일 다운로드

### 생성 파일
```
src/app/statistics/page.tsx
src/components/features/statistics/
├── period-selector.tsx
├── summary-cards.tsx
├── category-pie-chart.tsx
├── trend-line-chart.tsx
├── daily-heatmap.tsx
├── comparison-card.tsx
└── export-button.tsx
src/lib/export-utils.ts
```

### 추가 패키지
- `@nivo/calendar` (히트맵용)

---

## Phase 4: 자산 관리 페이지

### 목표
사용자의 모든 자산(현금, 은행, 투자, 부동산 등)을 한눈에 볼 수 있는
`/assets` 페이지를 구현한다.

### 세부 기능

**4.1 자산 대시보드**
- 총 자산 금액 표시
- 유형별 자산 분포 (Pie Chart)

**4.2 자산 목록**
- 유형별 그룹핑 (현금, 은행, 투자, 부동산, 기타)
- 개별 자산 카드 (이름, 잔액, 메모)

**4.3 자산 CRUD**
- 새 자산 추가 폼
- 자산 정보 수정 (잔액 업데이트)
- 자산 삭제

**4.4 자산 필터링**
- 유형별 필터

### 생성 파일
```
src/app/assets/page.tsx
src/components/features/assets/
├── asset-dashboard.tsx
├── asset-list.tsx
├── asset-card.tsx
├── asset-form.tsx
└── asset-distribution-chart.tsx
src/hooks/use-assets.ts
```

---

## Phase 5: 투자 내역 관리 페이지

### 목표
주식, ETF, 펀드, 암호화폐 등 투자 자산의 상세 관리 페이지를 구현한다.
매수/매도 이력, 평가 손익, 포트폴리오 현황을 제공한다.

### 스키마 확장

```prisma
model InvestmentAccount {
  id        String    @id @default(cuid())
  name      String    // "삼성증권", "키움증권"
  type      String    // "stock" | "fund" | "crypto"
  broker    String?
  assetId   String?   @unique
  asset     Asset?    @relation(...)
  holdings  Holding[]
}

model Holding {
  id           String    @id @default(cuid())
  accountId    String
  symbol       String    // 종목코드 (005930)
  name         String    // 종목명 (삼성전자)
  type         String    // "stock" | "etf" | "fund"
  quantity     Float
  averageCost  Float
  currentPrice Float?
  transactions InvestmentTransaction[]
}

model InvestmentTransaction {
  id        String    @id @default(cuid())
  holdingId String
  type      String    // "buy" | "sell" | "dividend"
  quantity  Float
  price     Float
  fee       Float     @default(0)
  date      DateTime
}
```

### 세부 기능

**5.1 투자 대시보드**
- 총 평가금액, 총 투자금액
- 전체 손익 (금액, 수익률)
- 계좌별 현황 요약

**5.2 투자 계좌 관리**
- 계좌 목록 (증권사별)
- 계좌 추가/수정/삭제

**5.3 보유 종목 관리**
- 종목 목록 (수량, 평균단가, 현재가, 손익)
- 종목 추가 (신규 매수)
- 현재가 수동 업데이트

**5.4 거래 내역**
- 매수/매도/배당 이력
- 거래 추가 (매수, 매도 기록)

**5.5 손익 계산**
- 평가손익 = (현재가 - 평균단가) × 수량
- 수익률 = 평가손익 / 투자금액 × 100
- 실현손익 (매도 시 계산)

**5.6 Asset 연동**
- 투자 계좌의 총 평가금액을 Asset.balance와 동기화

### 생성 파일
```
prisma/schema.prisma (모델 추가)
src/repositories/investment-*.ts
src/services/investment-service.ts
src/app/api/investments/**
src/app/investments/
├── page.tsx (대시보드)
├── accounts/page.tsx
└── holdings/[id]/page.tsx
src/components/features/investments/
├── investment-dashboard.tsx
├── account-list.tsx, account-form.tsx
├── holding-list.tsx, holding-form.tsx
├── transaction-list.tsx, transaction-form.tsx
├── profit-loss-card.tsx
└── portfolio-chart.tsx
src/hooks/use-investments.ts
src/types/index.ts (투자 관련 타입 추가)
```

---

## 구현 순서

```
Phase 1 (API/인프라)
       ↓
Phase 2 (거래 UI) ←──→ Phase 4 (자산 UI)  [병렬 가능]
       ↓
Phase 3 (통계 UI)
       ↓
Phase 5 (투자 관리) - Phase 4 완료 후 권장
```

---

## 기술 스택 (추가 예정)

| 용도 | 기술 |
|-----|------|
| 상태 관리 | React Query 또는 SWR |
| 폼 처리 | React Hook Form |
| 날짜 선택 | react-day-picker 또는 date-fns |
| 히트맵 차트 | @nivo/calendar |
| CSV 내보내기 | papaparse |
