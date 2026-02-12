# PennyPair - 세션 요약

## 🎯 **현재 상태**

**프로젝트 단계**: Step 2 완료 (스캐폴딩 + 코어 구현) → 앱 테스트 대기

**완료된 작업:**
- Step 1: 프로젝트 초기화 + 아키텍처 설계 + 문서화 + DB SQL 7개
- Step 2: SQL RLS 버그 수정 + Supabase DB 실행 완료 + Vite 스캐폴딩 + 의존성 설치 + 전체 소스코드 30+ 파일 작성 + 빌드 성공

**다음 단계:**
1. 브라우저 접근 확인 (포트 포워딩)
2. Supabase에서 유저 2명 회원가입 (fairytooth + maki)
3. couples 테이블 수동 INSERT
4. 앱 실동작 테스트 (로그인 → 거래 추가 → 대시보드 → 정산)

---

## 📚 **프로젝트 개요**

국제 커플(한국-일본) 공유 가계부 웹앱
- **핵심 기능**: 이중 통화 자동 변환 (KRW↔JPY), 커플 간 정산, 한/일/영 다국어
- **기술 스택**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Supabase + Recharts
- **환율 API**: Frankfurter API (무료, 키 불필요)
- **인증**: Supabase Auth (이메일/비밀번호)
- **유저**: fairytooth (한국, KRW) + maki (일본, JPY)

---

## 🗂️ **생성된 파일 목록**

### 문서 + DB (Step 1)
| 파일 | 역할 |
|------|------|
| `CLAUDE.md` | 프로젝트 컨벤션 |
| `README.md` | 프로젝트 소개 |
| `doc/architecture.md` | 아키텍처 결정 문서 (7개 섹션) |
| `db/init/01~07.sql` | DB 스키마 + 시드 + 함수 (Supabase 실행 완료) |

### 소스코드 (Step 2, 30+ 파일)
| 레이어 | 파일 |
|--------|------|
| 설정 | `vite.config.ts`, `.env`, `index.html`, `package.json` |
| 타입 | `src/types/index.ts` (엔티티 + Row + Input + 상수) |
| 유틸 | `src/utils/format.ts`, `settlement.ts` |
| 서비스 | `src/services/supabase.ts` (CRUD + 매핑), `exchangeRate.ts` |
| i18n | `src/i18n/index.ts` + `locales/en,ko,ja.json` |
| Context | `AuthContext.tsx`, `CoupleContext.tsx` |
| Hooks | `useAuth`, `useCouple`, `useTransactions`, `useSettlements`, `useExchangeRate` |
| 공통 | `Layout`, `Modal`, `CurrencyDisplay`, `LoadingSpinner`, `ProtectedRoute` |
| 거래 | `TransactionForm`, `TransactionList` |
| 대시보드 | `SummaryCards`, `CategoryPieChart`, `MonthlyTrendChart`, `AnnualAnalysis` |
| 정산 | `BalanceSummary`, `SettlementHistory` |
| 페이지 | `Login`, `Dashboard`, `Transactions`, `Settlement`, `Settings` |

---

## 🧠 **핵심 설계 결정**

1. **couple_id 기준 데이터 스코프** (user_id 아님) - 커플 공유 앱
2. **거래 시점 환율 영구 저장** - 과거 금액 변동 방지
3. **PostgreSQL ENUM 타입** - TEXT 대신 currency_code, language_code, transaction_type, split_type
4. **AuthContext / CoupleContext 분리** - 인증 → 데이터 순서 보장
5. **서비스 레이어 패턴** - supabase.ts에 CRUD 집중, 나중에 백엔드 교체 용이
6. **Frontend-only MVP** - Supabase RLS로 보안, Edge Functions는 필요시 도입

---

## 🔗 **참조 파일**

- 상세 기록: `claude-sessions/details/HISTORY_SETUP_DETAILS.md` (세션 1: 설계, 세션 2: 구현)
- 설계 요약: `claude-sessions/HISTORY_SETUP.md`

## ⚠️ **해결된 이슈**

1. **SQL RLS 순서 의존성**: `01.profiles.sql`이 미생성 `couples` 테이블 참조 → RLS를 `02.couples.sql`로 이동
2. **verbatimModuleSyntax**: `import type` 사용으로 해결
