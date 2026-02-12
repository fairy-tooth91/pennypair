# HISTORY_SETUP_DETAILS - 프로젝트 초기 설정 상세 기록

---

## 세션 1: 프로젝트 생성 + 아키텍처 설계 + 문서화 (2026-02-11)

### 🔍 Claude 판단 과정

**실작업 분석:**
- Write 도구: 11개 파일 생성 (문서 3개 + SQL 7개 + .gitignore)
- Bash 도구: git init, GitHub 레포 API 생성, remote 설정, push
- Task 도구: Explore (finance-diary 분석) + Plan (아키텍처 설계)
- 시스템 변경: 디렉토리 생성, git 저장소, GitHub 원격 레포

**세션 분류**: setup (프로젝트 초기 설정)

---

### 📋 작업 흐름

#### 1단계: 프로젝트 생성
- 사용자 요청: `/root/Workspace/playground` 에 가계부 웹앱 프로젝트 생성
- 프로젝트명 제안: **pennypair** (penny 돈 + pair 둘이서)
- `mkdir /root/Workspace/playground/pennypair`
- `git init` + `.gitignore` 생성 (finance-diary와 동일)
- GitHub 레포 생성 시도 → 이미 존재 → `git remote set-url` + `git push`

#### 2단계: 요구사항 수집
사용자로부터 수집한 핵심 요구사항:

**기능:**
- 수입/지출 기록 + 대시보드 + 정산 기능
- 입력 시점의 환율로 원화↔엔화 자동 변환 저장
- 연간/월별 지출 분석

**인증:** Supabase Auth (이메일/비밀번호)

**다국어:**
- 한/일/영 3개 언어
- 로그인 화면: 영어 전용
- 로그인 후: 프로필 설정 언어 (접속 지역 기반 감지 → 설정 저장)

**유저:** fairytooth (한국, KRW) + maki (일본, JPY)

#### 3단계: finance-diary 분석 (Explore Agent)
finance-diary 프로젝트 구조를 Explore 에이전트로 분석:

- **기술 스택**: React 19 + TypeScript 5.9 + Vite 7.2 + Tailwind CSS 4.1 + Supabase + Recharts
- **패턴**: Context API + Custom Hooks, Optimistic UI, snake_case↔camelCase 매핑
- **서비스 레이어**: `supabase.ts`에 모든 CRUD 집중, toX()/fromX() 매핑 함수
- **상태 관리**: FinanceContext + useFinanceData 훅 (535줄)
- **라우팅**: React Router v7, BrowserRouter, GitHub Pages SPA 핵

#### 4단계: 아키텍처 설계 (Plan Agent)
Plan 에이전트로 상세 설계:

**DB 스키마:**
- ENUM 4개: currency_code, language_code, transaction_type, split_type
- 테이블 6개: profiles, couples, categories, transactions, settlements, exchange_rate_cache
- 사용자 피드백: "TEXT 너무 많다" → ENUM + VARCHAR(N)으로 수정

**백엔드 분리 분석:**
- Frontend-only: 빠른 개발, $0 비용, RLS 보안 ✅
- API Server: 서버 로직 추가 가능, 복잡도 2배 ❌
- Edge Functions: 절충안, 점진적 도입 가능 ⭕
- **결론**: MVP는 Frontend-only → 필요시 Edge Functions

**분리 트리거 조건:** ① 푸시알림 ② 이메일 발송 ③ 스케줄링 ④ PDF 리포트

**환율 API 선택:** Frankfurter API
- 무료, API 키 불필요, 속도 제한 없음
- ECB 데이터, KRW/JPY/USD 지원, 과거 환율 조회 가능

#### 5단계: 문서 작성
사용자 요청: "문서 먼저 생산하고 해줘"

**CLAUDE.md** (프로젝트 컨벤션):
- 기술 스택, 폴더 구조, 코딩 컨벤션
- DB 스키마 요약, 아키텍처 패턴
- 다국어/다통화 처리 규칙
- 주요 타입 정의

**README.md** (프로젝트 소개):
- finance-diary README 형식 참고
- 기능 목록, 데이터 구조, 명령어

**doc/architecture.md** (아키텍처 결정):
- 백엔드 분리 분석 (3가지 구조 비교)
- 데이터 스코프 결정 (couple_id vs user_id)
- 이중 통화 저장 전략
- 인증 흐름, i18n 전략, 환율 API, 정산 로직

#### 6단계: SQL 스크립트 작성
7개 파일 순서대로 작성:

1. **01.profiles.sql**: ENUM 4개 생성 + profiles 테이블 + auth 트리거 (회원가입 시 자동 프로필 생성) + updated_at 트리거 + RLS (본인+파트너만 조회)
2. **02.couples.sql**: couples 테이블 + UNIQUE + CHECK(자기자신 방지) + RLS
3. **03.categories.sql**: categories + 시드 데이터 14개 (지출 10 + 수입 4) + RLS (인증 유저 읽기)
4. **04.transactions.sql**: 핵심 테이블. 이중 통화 (amount/currency + converted_amount/converted_currency + exchange_rate) + 정산 (split_type + split_ratio) + 인덱스 4개 + RLS 4개 (SELECT/INSERT/UPDATE/DELETE)
5. **05.settlements.sql**: settlements + CHECK(본인↔본인 방지) + RLS
6. **06.exchange_rate_cache.sql**: 환율 캐시 + UNIQUE(통화쌍+날짜) + 인덱스 2개
7. **07.functions.sql**: get_couple_id, get_partner_id, get_couple_balance (PL/pgSQL 함수, split_type별 잔액 계산 로직 포함)

---

### 🔗 참조 프로젝트
- finance-diary (`/root/Workspace/playground/finance-diary/`): 동일 기술 스택 참고
- Supabase URL: `afypqjipbjjdmzevsxow.supabase.co` (finance-diary) vs `ibuyfrrxkgpkppkbauvl.supabase.co` (pennypair)

### ⚠️ 미완료 사항 → 세션 2에서 해결됨

---

## 세션 2: Step 2 프로젝트 스캐폴딩 + 전체 코어 구현 (2026-02-11)

### 🔍 Claude 판단 과정

**실작업 분석:**
- Write 도구: 30+ 파일 생성 (전체 src/ 프로젝트 구조)
- Edit 도구: SQL 버그 수정 (01, 02), TypeScript import 수정, 설정 파일 수정
- Bash 도구: npm create vite, npm install (3회), tsc --noEmit, npm run build, dev server
- 시스템 변경: 전체 React 앱 스캐폴딩 완료, 프로덕션 빌드 성공

**세션 분류**: setup (Step 2 스캐폴딩 + 코어 구현)

---

### 📋 작업 흐름

#### 1단계: SQL 스크립트 버그 수정
사용자가 Supabase에서 SQL 실행 시 에러 발생:
```
Error: Failed to run sql query: relation "public.couples" does not exist
```

**원인 분석:**
- `01.profiles.sql`의 RLS 정책 `profiles_select_own_and_partner`가 아직 생성되지 않은 `public.couples` 테이블 참조 (81행)
- `couples` 테이블은 `02.couples.sql`에서 생성되므로 순서 의존성 문제

**해결:**
- `01.profiles.sql`: `profiles_select_own_and_partner` → `profiles_select_own`으로 변경 (본인만 조회)
- `02.couples.sql`: couples 생성 후 `profiles_select_own` DROP → `profiles_select_own_and_partner`로 교체

사용자가 02 실행 시 "destructive operation" 경고 → DROP POLICY 때문이므로 정상, 실행 확인

#### 2단계: Vite 스캐폴딩
- `/tmp/pennypair-scaffold`에 임시 생성 후 기존 프로젝트에 복사 (기존 파일 보존)
- `npm install` 기본 의존성 설치

#### 3단계: 의존성 설치
```bash
# 프로젝트 의존성
npm install @supabase/supabase-js react-router-dom react-i18next i18next i18next-browser-languagedetector recharts

# 개발 의존성
npm install -D tailwindcss @tailwindcss/vite
```

#### 4단계: 설정 파일 구성
- `vite.config.ts`: Tailwind 플러그인 + `base: '/pennypair/'`
- `index.html`: 타이틀 PennyPair로 변경
- `src/index.css`: Tailwind CSS 4 `@import "tailwindcss";`
- `.env`: Supabase URL + anon key
- `.gitignore`: `.env` 추가

#### 5단계: 전체 소스코드 작성 (30+ 파일)

**타입 (types/index.ts):**
- 기본 타입: Currency, Language, TransactionType, SplitType
- camelCase 엔티티: Profile, Couple, Category, Transaction, Settlement, ExchangeRateCache
- snake_case Row 타입: ProfileRow, CoupleRow 등 (Supabase 응답용)
- 입력용 타입: TransactionInput, SettlementInput
- 상수: CURRENCIES, CURRENCY_SYMBOLS, LOCALE_MAP

**유틸리티:**
- `utils/format.ts`: formatCurrency, formatDate, formatMonth, toDateString, getCurrentMonth (Intl API 사용)
- `utils/settlement.ts`: calculateBalance (split_type별 잔액 계산)

**서비스 레이어:**
- `services/supabase.ts`:
  - createClient 초기화
  - 매핑 함수 6개 (toProfile, toCouple, toCategory, toTransaction, toSettlement, toExchangeRate)
  - Auth: signUp, signIn, signOut
  - CRUD: fetchProfile, updateProfile, fetchCouple, fetchCategories, fetchTransactions, createTransaction, updateTransaction, deleteTransaction, fetchSettlements, createSettlement
  - 환율 캐시: fetchCachedRate, saveCachedRate
- `services/exchangeRate.ts`: getExchangeRate (캐시 확인 → API 호출 → 캐시 저장), convertAmount

**i18n:**
- `i18n/index.ts`: i18next 초기화 (LanguageDetector + localStorage)
- `i18n/locales/en.json`: 영어 번역 (8개 섹션)
- `i18n/locales/ko.json`: 한국어 번역
- `i18n/locales/ja.json`: 일본어 번역

**Context + Hooks:**
- `context/AuthContext.tsx`: user, profile, session 상태 + login/register/logout/refreshProfile + i18n 언어 동기화
- `context/CoupleContext.tsx`: couple, partner, categories, transactions + selectedMonth + refreshTransactions
- `hooks/useAuth.ts`, `hooks/useCouple.ts`: Context 소비 훅
- `hooks/useTransactions.ts`: addTransaction (환율 자동 변환), editTransaction, removeTransaction (Optimistic UI)
- `hooks/useSettlements.ts`: 정산 조회 + 생성
- `hooks/useExchangeRate.ts`: 실시간 환율 조회 훅

**공통 컴포넌트:**
- `Layout.tsx`: 헤더 + 4탭 하단 네비게이션 (NavLink)
- `Modal.tsx`: 바텀시트 스타일 모달 (body overflow 제어)
- `CurrencyDisplay.tsx`: 이중 통화 표시 (₩50,000 / ¥5,500)
- `LoadingSpinner.tsx`: 스피너 + 로딩 텍스트
- `ProtectedRoute.tsx`: 인증 가드 (미인증 → /login 리다이렉트)

**거래 컴포넌트:**
- `TransactionForm.tsx`: 날짜, 타입 토글, 카테고리 그리드, 금액+통화, 환율 표시, split_type 선택, 메모
- `TransactionList.tsx`: 거래 목록 (카테고리 아이콘, 결제자, 이중통화, split 표시, 삭제 버튼)

**대시보드 컴포넌트:**
- `SummaryCards.tsx`: 수입/지출/순수익 3칸 카드 (home_currency 기준 통합)
- `CategoryPieChart.tsx`: Recharts PieChart (카테고리별 지출)
- `MonthlyTrendChart.tsx`: Recharts LineChart (수입/지출 트렌드)
- `AnnualAnalysis.tsx`: Recharts BarChart (월별 지출 + 평균)

**정산 컴포넌트:**
- `BalanceSummary.tsx`: calculateBalance 사용, 누가 누구에게 얼마 (or 정산 완료)
- `SettlementHistory.tsx`: 정산 히스토리 목록

**페이지:**
- `Login.tsx`: 로그인/회원가입 토글, 에러 표시, 영어 고정
- `Dashboard.tsx`: 월 이동 + SummaryCards + 3개 차트
- `Transactions.tsx`: 월 이동 + TransactionList + FAB + 모달(TransactionForm)
- `Settlement.tsx`: BalanceSummary + 정산하기 버튼 + SettlementHistory
- `Settings.tsx`: displayName, language, currency 설정 + 로그아웃

**라우팅:**
- `App.tsx`: BrowserRouter (basename="/pennypair"), AuthProvider > Routes, ProtectedRoute 안에 CoupleProvider + Layout
- `main.tsx`: i18n 초기화 + App 렌더

#### 6단계: 빌드 에러 수정

**에러 1: verbatimModuleSyntax**
```
src/utils/format.ts: 'Currency' is a type and must be imported using a type-only import
```
- `format.ts`: `import { Currency, Language, LOCALE_MAP }` → `import { type Currency, type Language, LOCALE_MAP }`
- `settlement.ts`: `import { Transaction, Currency }` → `import type { Transaction, Currency }`

#### 7단계: 빌드 + 개발 서버 실행
```bash
npm run build  # ✅ tsc + vite build 성공 (870KB bundle)
npm run dev    # ✅ localhost:5173/pennypair/ 응답 200
```

---

### ⚠️ 미완료 사항
- 브라우저에서 앱 접근 테스트 (포트 포워딩 확인 필요)
- Supabase 유저 회원가입 (fairytooth + maki)
- couples 테이블 수동 INSERT
- 앱 실동작 테스트 (로그인, 거래 추가, 정산 등)
