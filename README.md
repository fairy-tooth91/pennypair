# PennyPair - 국제 커플 가계부

## 프로젝트 개요

국제 커플을 위한 공유 가계부 웹앱. 이중 통화 자동 변환, 커플 간 정산, 한/일/영 다국어 지원.

- **GitHub**: https://github.com/fairy-tooth91/pennypair
- **Supabase**: `ibuyfrrxkgpkppkbauvl.supabase.co` (public 스키마)

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS 4 |
| 차트 | Recharts |
| 다국어 | react-i18next (한/일/영) |
| 환율 API | Frankfurter API (무료, 키 불필요) |
| 인증/DB | Supabase (PostgreSQL + Auth) |
| 배포 | GitHub Pages |

## 폴더 구조

```
src/
├── components/
│   ├── common/              # Layout, Modal, CurrencyDisplay, LoadingSpinner
│   ├── transaction/         # TransactionForm, TransactionList
│   ├── dashboard/           # SummaryCards, CategoryPieChart, MonthlyTrendChart, AnnualAnalysis
│   └── settlement/          # BalanceSummary, SettlementHistory
├── context/
│   ├── AuthContext.tsx       # Supabase Auth 상태 관리
│   └── CoupleContext.tsx     # 커플 데이터 + 거래내역
├── hooks/                   # useAuth, useCouple, useTransactions, useSettlements, useExchangeRate
├── i18n/
│   ├── index.ts             # i18next 설정
│   └── locales/             # en.json, ko.json, ja.json
├── pages/
│   ├── Login.tsx            # 로그인/회원가입 (영어)
│   ├── Dashboard.tsx        # 월별 요약 + 차트
│   ├── Transactions.tsx     # 거래 기록
│   ├── Settlement.tsx       # 커플 정산
│   └── Settings.tsx         # 언어/통화/프로필
├── services/
│   ├── supabase.ts          # Supabase CRUD + snake_case↔camelCase 매핑
│   └── exchangeRate.ts      # Frankfurter API + 캐싱
├── types/
│   └── index.ts             # TypeScript 타입 정의
└── utils/
    ├── format.ts            # 통화/날짜 포맷팅
    └── settlement.ts        # 정산 계산 로직

db/
└── init/                    # DB 스키마 SQL (실행 순서: 01→07)
```

## 구현 기능

### 1. 로그인 (`/login`)

- Supabase Auth (이메일/비밀번호)
- 회원가입 + 로그인
- 로그인 화면은 영어 전용
- 로그인 후 프로필 설정 언어로 전환

### 2. 대시보드 (`/`)

- 이번 달 수입/지출/순수익 요약 (로그인 유저 통화 기준)
- 카테고리별 지출 파이차트
- 월별 수입/지출 추이 라인차트
- 연간 지출 분석 (어디에 가장 많이 썼는지)

### 3. 거래 기록 (`/transactions`)

- 수입/지출 CRUD
- **이중 통화 자동 변환**: 입력한 통화 + 상대방 통화 동시 표시
  - 예: fairytooth가 ₩50,000 입력 → ¥5,500으로 자동 변환 표시
  - 예: maki가 ¥3,000 입력 → ₩27,000으로 자동 변환 표시
- 거래 시점 환율 영구 저장 (Frankfurter API)
- 카테고리 분류 (식비, 교통, 쇼핑 등 14종)
- 월별/유형별 필터링
- 정산 방식 지정 (50:50, 커스텀 비율, 본인용, 상대방용)

### 4. 정산 (`/settlement`)

- 커플 간 잔액 실시간 표시 ("fairytooth가 maki에게 ₩23,400")
- 정산 방식: 50:50, 커스텀 비율, 본인 지출, 상대방 대신 지출
- 정산 기록 + 히스토리
- 기간별 조회

### 5. 설정 (`/settings`)

- 언어 변경 (한국어/일본어/영어)
- 기본 통화 변경 (KRW/JPY/USD)
- 프로필 수정 (표시 이름)
- Supabase 연결 상태

## 데이터 구조

### DB 스키마
- **4개 ENUM 타입**: currency_code, language_code, transaction_type, split_type
- **6개 테이블**: profiles, couples, categories, transactions, settlements, exchange_rate_cache
- 모든 데이터는 `couple_id` 기준으로 공유 (커플 양쪽 모두 접근 가능)
- RLS (Row Level Security) 적용
- snake_case (DB) ↔ camelCase (TypeScript) 자동 매핑

### 주요 타입
```typescript
interface Transaction {
  id: string;
  coupleId: string;
  paidBy: string;                    // 결제자
  date: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;                    // 원본 금액
  currency: Currency;                // 원본 통화
  convertedAmount: number | null;    // 상대방 통화 변환
  convertedCurrency: Currency | null;
  exchangeRate: number | null;       // 적용 환율
  splitType: SplitType;              // 정산 방식
  splitRatio: number;                // 결제자 부담 비율
  memo: string;
}
```

## 명령어

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run test      # 테스트 실행
npx gh-pages -d dist  # GitHub Pages 배포
```
