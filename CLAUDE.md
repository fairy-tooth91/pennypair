# PennyPair - 국제 커플 가계부 웹앱

> **Personal Project** — 이 프로젝트는 개인 사이드 프로젝트이며, 소속 회사(Ncurion/업무)와 무관합니다.

## 프로젝트 개요

국제 커플(한국-일본)을 위한 공유 가계부 웹앱. 이중 통화 자동 변환, 커플 간 정산, 한/일/영 다국어 지원.

- **GitHub**: https://github.com/fairy-tooth91/pennypair
- **Supabase**: `ibuyfrrxkgpkppkbauvl.supabase.co` (public 스키마)

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS 4 |
| 차트 | Recharts |
| 다국어 | react-i18next + i18next-browser-languagedetector |
| 환율 API | Frankfurter API (`api.frankfurter.dev`, 무료, 키 불필요) |
| 인증/DB | Supabase (PostgreSQL + Auth) |
| 배포 | GitHub Pages |

## 폴더 구조

```
src/
├── components/
│   ├── common/
│   │   ├── Layout.tsx           # 헤더 + 4탭 네비게이션
│   │   ├── Modal.tsx            # 공통 모달 컴포넌트
│   │   ├── CurrencyDisplay.tsx  # 이중 통화 표시 (₩50,000 / ¥5,500)
│   │   ├── LoadingSpinner.tsx   # 로딩 스피너
│   │   └── ProtectedRoute.tsx   # 인증 필수 라우트
│   ├── transaction/
│   │   ├── TransactionForm.tsx  # 거래 입력/수정 폼 (환율 자동 변환)
│   │   └── TransactionList.tsx  # 거래 목록 (이중 통화 표시)
│   ├── dashboard/
│   │   ├── SummaryCards.tsx     # 월별 수입/지출/순수익 카드
│   │   ├── CategoryPieChart.tsx # 카테고리별 지출 파이차트
│   │   ├── MonthlyTrendChart.tsx # 월별 트렌드 라인차트
│   │   └── AnnualAnalysis.tsx   # 연간 지출 분석
│   └── settlement/
│       ├── BalanceSummary.tsx   # 커플 간 잔액 표시
│       └── SettlementHistory.tsx # 정산 히스토리
├── context/
│   ├── AuthContext.tsx          # Supabase Auth 상태 관리
│   └── CoupleContext.tsx        # 커플 데이터 + 거래내역 관리
├── hooks/
│   ├── useAuth.ts              # AuthContext 소비 훅
│   ├── useCouple.ts            # CoupleContext 소비 훅
│   ├── useTransactions.ts      # 거래 CRUD + Optimistic UI
│   ├── useSettlements.ts       # 정산 계산 + CRUD
│   └── useExchangeRate.ts      # 환율 조회 + 캐싱
├── i18n/
│   ├── index.ts                # i18next 초기화
│   └── locales/
│       ├── en.json             # 영어
│       ├── ko.json             # 한국어
│       └── ja.json             # 일본어
├── pages/
│   ├── Login.tsx               # 로그인/회원가입 (영어 전용)
│   ├── Dashboard.tsx           # 월별 요약 + 차트 + 연간 분석
│   ├── Transactions.tsx        # 거래 기록 목록 + 입력
│   ├── Settlement.tsx          # 커플 간 정산
│   └── Settings.tsx            # 언어/통화/프로필 설정
├── services/
│   ├── supabase.ts             # Supabase 클라이언트 + 전체 CRUD
│   └── exchangeRate.ts         # Frankfurter API + Supabase 캐싱
├── types/
│   └── index.ts                # TypeScript 인터페이스 + 상수
└── utils/
    ├── format.ts               # 통화/날짜 포맷 (locale별 Intl 사용)
    └── settlement.ts           # 정산 계산 로직

db/
└── init/                       # DB 스키마 SQL (실행 순서: 01→07)
    ├── 01.profiles.sql         # profiles 테이블 + auth 트리거
    ├── 02.couples.sql          # couples 테이블 + RLS
    ├── 03.categories.sql       # categories + 시드 데이터 14개
    ├── 04.transactions.sql     # transactions (이중 통화 + 정산)
    ├── 05.settlements.sql      # settlements 테이블
    ├── 06.exchange_rate_cache.sql
    └── 07.functions.sql        # get_partner_id, get_couple_id
```

## 코딩 컨벤션

### DB ↔ TypeScript 매핑
- **DB**: snake_case (`couple_id`, `paid_by`, `exchange_rate`)
- **TypeScript**: camelCase (`coupleId`, `paidBy`, `exchangeRate`)
- `services/supabase.ts`에서 `toX()` / `fromX()` 매핑 함수로 변환

### 환경 변수
- `.env` 파일에 Supabase 키 보관 (소스코드에 하드코딩 금지)
- Vite 환경 변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- 접근: `import.meta.env.VITE_SUPABASE_URL`

### 다국어 처리
- i18n 키: `t('nav.dashboard')`, `t('category.food')` 형식
- 카테고리 이름: DB에 `i18n_key` 저장, UI에서 `t(category.i18nKey)`로 번역
- 로그인 전: 영어 고정 / 로그인 후: 프로필의 `preferred_language`
- 통화 포맷: `Intl.NumberFormat` 사용 (`formatCurrency(amount, currency, locale)`)
- 날짜 포맷: `Intl.DateTimeFormat` 사용 (`formatDate(date, locale)`)

### 다통화 처리
- 거래 입력 시 원본 통화 + 상대방 통화 자동 변환 저장
- 환율: Frankfurter API (`api.frankfurter.dev`) → `exchange_rate_cache` 테이블에 일별 캐싱
- 거래 시점 환율 영구 저장 (과거 금액 변동 방지)
- 대시보드: 로그인 유저의 `home_currency` 기준으로 금액 통합 표시

## 아키텍처 패턴

### 상태 관리: Context API + Custom Hooks
- `AuthContext`: 인증 상태 (login/logout/signup + profile)
- `CoupleContext`: 커플 데이터 + 거래내역 + 카테고리 (인증 후 로딩)
- 분리 이유: 인증 완료 → 커플 데이터 로딩 순서 보장

### 데이터 스코프: couple_id 기준
- finance-diary: `user_id` 기준 (개인 앱)
- pennypair: `couple_id` 기준 (커플 공유 앱)
- 모든 거래/정산은 `couple_id`로 필터링, 양쪽 유저 모두 접근 가능
- `paid_by` 필드로 누가 결제했는지 추적

### Optimistic UI
- UI 즉시 업데이트 → Supabase 백그라운드 동기화
- 실패 시 롤백 + 에러 표시

### RLS (Row Level Security)
- 모든 테이블에 RLS 적용
- 커플 데이터: `couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())`

## DB 스키마

### ENUM 타입
```sql
CREATE TYPE currency_code AS ENUM ('KRW', 'JPY', 'USD');
CREATE TYPE language_code AS ENUM ('ko', 'ja', 'en');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE split_type AS ENUM ('50_50', 'custom', 'paid_for_self', 'paid_for_partner');
```

### 테이블 요약 (6개)

| 테이블 | 역할 | 핵심 컬럼 |
|--------|------|-----------|
| profiles | 유저 프로필 (auth.users 확장) | display_name, home_currency, preferred_language |
| couples | 커플 연결 | user1_id, user2_id |
| categories | 거래 카테고리 | i18n_key, icon, type(ENUM) |
| transactions | 거래 기록 (핵심) | amount/currency + converted_amount/converted_currency + exchange_rate + split_type |
| settlements | 정산 기록 | settled_by, settled_to, amount, period |
| exchange_rate_cache | 환율 캐시 | base_currency, target_currency, rate, rate_date |

### 주요 타입
```typescript
type Currency = 'KRW' | 'JPY' | 'USD';
type Language = 'ko' | 'ja' | 'en';

interface Transaction {
  id: string;
  coupleId: string;
  paidBy: string;                    // 결제자 UUID
  date: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;                    // 원본 금액
  currency: Currency;                // 원본 통화
  convertedAmount: number | null;    // 상대방 통화 변환 금액
  convertedCurrency: Currency | null;
  exchangeRate: number | null;       // 적용 환율
  splitType: '50_50' | 'custom' | 'paid_for_self' | 'paid_for_partner';
  splitRatio: number;                // 결제자 부담 비율 (기본 50)
  memo: string;
}

interface Profile {
  id: string;
  displayName: string;
  email: string;
  homeCurrency: Currency;
  preferredLanguage: Language;
  avatarUrl: string | null;
}

interface Settlement {
  id: string;
  coupleId: string;
  settledBy: string;
  settledTo: string;
  amount: number;
  currency: Currency;
  periodStart: string;
  periodEnd: string;
  memo: string;
  settledAt: string;
}
```

## 브랜치 전략

- `master`: 안정 버전
- `gh-pages`: GitHub Pages 배포 (자동 생성)

## 명령어

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run test      # 테스트 실행
npx gh-pages -d dist  # GitHub Pages 배포
```

## TODO

- [ ] Phase 1: 문서 + DB 스키마
- [ ] Phase 2: 인증 + i18n + 서비스 레이어
- [ ] Phase 3: 거래 기록 + 대시보드
- [ ] Phase 4: 정산 시스템
- [ ] Phase 5: 설정 페이지 + 마무리
