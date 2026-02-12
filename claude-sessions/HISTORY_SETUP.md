# HISTORY_SETUP - 프로젝트 초기 설정

## 세션 1: 프로젝트 생성 + 아키텍처 설계 + 문서화 (2026-02-11)

### 작업 요약
- pennypair 프로젝트 생성 (git init + GitHub 레포)
- finance-diary 프로젝트 구조 분석 (참고용)
- 전체 아키텍처 설계 (DB 스키마, 프로젝트 구조, 기술 스택)
- 백엔드 분리 분석 (Frontend-only vs API Server vs Edge Functions)
- 프로젝트 문서 3종 작성 (CLAUDE.md, README.md, doc/architecture.md)
- DB SQL 스크립트 7개 작성

### 핵심 결정 사항
1. **기술 스택**: finance-diary 동일 (React 19 + Vite + TS + Tailwind + Supabase) + react-i18next + Frankfurter API
2. **DB 설계**: ENUM 4개 + 테이블 6개, couple_id 기준 스코프
3. **백엔드**: MVP는 Frontend-only, 분리 트리거 조건 정의 (푸시알림/이메일/스케줄링)
4. **다국어**: react-i18next, 카테고리는 DB i18n_key + JSON 번역 파일
5. **환율**: Frankfurter API + Supabase 일별 캐싱, 거래 시점 환율 영구 저장

### 사용자 요구사항
- 여자친구(일본인 maki)와 공유하는 가계부
- 이중 통화 (KRW↔JPY) 자동 변환 + 기록 시점 환율 저장
- 한/일/영 다국어 (로그인 전 영어, 로그인 후 프로필 설정)
- 커플 간 정산 기능 (50:50, 커스텀, 본인용, 상대방용)
- 월별/연간 지출 분석 대시보드
- Supabase Auth (이메일/비밀번호)
- 향후 이메일 기반 커플 초대 확장 가능성

### Supabase 정보
- URL: `https://ibuyfrrxkgpkppkbauvl.supabase.co`
- Anon Key: `sb_publishable_wfC6LGu095lcAw2AnR-_CA__sBjCf3v`

---

## 세션 2: Step 2 스캐폴딩 + 전체 코어 구현 (2026-02-11)

### 작업 요약
- SQL 스크립트 RLS 순서 버그 수정 (01↔02 간 couples 참조 의존성)
- Supabase에 SQL 01~07 전체 실행 완료 (사용자)
- Vite + React + TypeScript 스캐폴딩
- 의존성 설치 (Tailwind CSS 4, Supabase, i18n, Recharts, React Router)
- 전체 소스코드 30+ 파일 작성 (타입→유틸→서비스→i18n→Context→Hooks→컴포넌트→페이지→라우팅)
- TypeScript 빌드 에러 수정 (verbatimModuleSyntax)
- 프로덕션 빌드 성공 + 개발 서버 실행

### 핵심 이슈 해결
1. **SQL RLS 순서 의존성**: 01.profiles.sql이 아직 없는 couples 테이블 참조 → profiles RLS를 02로 이동
2. **verbatimModuleSyntax**: type-only import 누락 → `import type` / `import { type ... }` 으로 수정

### 생성된 파일 (30+ 파일)
- 설정: vite.config.ts, .env, index.html, package.json, .gitignore
- 타입: src/types/index.ts
- 유틸: src/utils/format.ts, settlement.ts
- 서비스: src/services/supabase.ts, exchangeRate.ts
- i18n: src/i18n/index.ts + locales (en/ko/ja.json)
- Context: src/context/AuthContext.tsx, CoupleContext.tsx
- Hooks: useAuth, useCouple, useTransactions, useSettlements, useExchangeRate
- 공통: Layout, Modal, CurrencyDisplay, LoadingSpinner, ProtectedRoute
- 거래: TransactionForm, TransactionList
- 대시보드: SummaryCards, CategoryPieChart, MonthlyTrendChart, AnnualAnalysis
- 정산: BalanceSummary, SettlementHistory
- 페이지: Login, Dashboard, Transactions, Settlement, Settings
- 라우팅: App.tsx, main.tsx
