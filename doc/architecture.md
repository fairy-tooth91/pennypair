# PennyPair 아키텍처 결정 문서

## 1. 백엔드 분리 분석

### 현재 구조: Frontend-only + Supabase Direct

```
[React SPA] ──직접 호출──> [Supabase]
                           ├── Auth (인증)
                           ├── PostgreSQL (데이터)
                           └── RLS (보안)
```

**장점:**
- 빠른 개발 속도 (서버 코드 없음)
- 인프라 최소화 (서버 호스팅 불필요, 비용 $0)
- Supabase RLS가 보안 담당 (테이블 단위 접근 제어)
- Supabase anon key는 public용으로 설계됨 (RLS로 보호, 노출되어도 안전)
- 실시간 구독 등 Supabase 기능 직접 사용 가능

**단점:**
- 비즈니스 로직이 프론트엔드에 노출 (정산 계산 등)
- 복잡한 서버 로직 추가 어려움 (푸시알림, 스케줄링, 이메일 발송)
- 환율 API 호출이 클라이언트에서 발생 (CORS 이슈 가능성)

### 대안: Backend API Server + Supabase

```
[React SPA] ──API 호출──> [Node.js/Deno API Server] ──서비스 키──> [Supabase]
```

**장점:**
- API 키를 서버에 완전히 숨김 (service_role key 사용 가능)
- 비즈니스 로직 중앙화 (정산 계산, 환율 변환)
- 서버 기능 추가 용이:
  - 푸시 알림 (월말 정산 리마인더)
  - 이메일 발송 (커플 초대, 월간 리포트)
  - 스케줄링 (매일 환율 캐싱, 정기 보고서)
  - Webhook 처리

**단점:**
- 추가 서버 인프라 필요 (호스팅 비용: Render/Fly.io 무료 티어 또는 월 $5~)
- 개발 시간 약 2배 (API 엔드포인트 설계 + 구현)
- 복잡도 증가 (CORS 설정, API 인증, 에러 핸들링)
- 프론트↔백 간 타입 동기화 부담

### 절충안: Supabase Edge Functions

```
[React SPA] ──직접 호출──> [Supabase]
                           ├── Auth, DB, RLS (기본)
                           └── Edge Functions (서버 로직)
```

**장점:**
- 별도 서버 없이 서버 로직 실행 가능
- Supabase 인프라 안에서 동작 (추가 호스팅 불필요)
- Deno 기반 TypeScript (프론트와 타입 공유 가능)
- 필요한 기능만 점진적으로 추가

**단점:**
- Deno 런타임 (Node.js 생태계와 차이)
- 무료 티어 제한 (500K invocations/month)

### 결론: 현재는 Frontend-only → 필요시 Edge Functions → 필요시 별도 서버

| 단계 | 시점 | 구조 |
|------|------|------|
| MVP (현재) | 지금 | Frontend + Supabase Direct |
| Phase 2 | 푸시알림/이메일 필요 시 | + Supabase Edge Functions |
| Phase 3 | 대규모 서비스 확장 시 | + 별도 API 서버 (Node.js) |

**분리 트리거 조건 (이 중 하나라도 필요해지면 Edge Functions 도입):**
1. 커플 초대 이메일 발송
2. 월말 정산 알림 (푸시/이메일)
3. 정기 환율 캐싱 (cron)
4. 월간/연간 리포트 PDF 생성

**마이그레이션 용이성 확보 전략:**
- `services/supabase.ts`에 모든 DB 호출을 집중
- 컴포넌트/훅은 서비스 레이어만 호출 (Supabase 직접 호출 금지)
- 나중에 서비스 레이어 내부만 API 호출로 교체하면 됨

---

## 2. 데이터 스코프: couple_id vs user_id

### 결정: couple_id 기준

**비교:**
| | finance-diary (개인 앱) | pennypair (커플 앱) |
|---|---|---|
| 스코프 | `user_id` | `couple_id` |
| 데이터 접근 | 본인 데이터만 | 커플 양쪽 모두 |
| 결제자 추적 | 불필요 | `paid_by` 필드 |
| RLS 정책 | `user_id = auth.uid()` | `couple_id IN (내 커플 ID)` |

**이유:**
- 가계부의 핵심은 "둘이 함께 보는 것"
- 모든 거래를 커플 단위로 조회해야 정산이 가능
- `paid_by` 필드로 "누가 결제했는지" 추적 → 정산 계산에 사용

---

## 3. 이중 통화 저장 전략

### 결정: 거래 시점 환율 + 변환 금액 영구 저장

**대안 1: 원본만 저장, 조회 시 변환** (채택 안 함)
```
transaction: { amount: 50000, currency: 'KRW' }
→ 조회 시: fetchRate('KRW', 'JPY', today) → 실시간 변환
```
- 문제: 오늘 환율로 과거 거래가 변동 (3월에 쓴 5만원이 6월에 다른 금액으로 보임)

**대안 2: 원본 + 변환 + 환율 모두 저장** (채택)
```
transaction: {
  amount: 50000, currency: 'KRW',           // 원본
  convertedAmount: 5500, convertedCurrency: 'JPY',  // 변환
  exchangeRate: 0.11                         // 당시 환율
}
```
- 과거 금액 불변 (3월 거래는 3월 환율 그대로)
- 환율 감사 추적 가능
- 조회 시 추가 API 호출 불필요

---

## 4. 인증 흐름

### 결정: Supabase Auth (이메일/비밀번호)

```
[로그인 화면 (영어)]
    ↓ login(email, password)
[Supabase Auth] → JWT 발급
    ↓ onAuthStateChange
[AuthContext] → profile 로딩 → i18n 언어 설정
    ↓
[CoupleContext] → couple + partner + 거래 데이터 로딩
    ↓
[앱 메인 화면 (유저 설정 언어)]
```

**초기 유저 설정:**
1. fairytooth, maki가 앱에서 회원가입
2. `auth.users` 생성 → 트리거로 `profiles` 자동 생성
3. Settings에서 display_name, home_currency, preferred_language 설정
4. `couples` 테이블에 수동 INSERT (향후 초대 기능으로 대체)

---

## 5. i18n 전략

### 결정: react-i18next + 번들 JSON

**언어 감지 우선순위:**
1. 프로필 설정 (`profile.preferred_language`) - 로그인 후
2. localStorage 캐시 - 이전 설정 기억
3. 브라우저 언어 (`navigator.language`) - 첫 방문
4. 폴백: `en` (영어)

**카테고리 번역:**
- DB: `categories.i18n_key = 'category.food'`
- JSON: `{ "category": { "food": "식비" } }` (ko), `{ "category": { "food": "食費" } }` (ja)
- UI: `t(category.i18nKey)` → 현재 언어에 맞는 이름 반환

**통화/날짜 포맷:**
- `Intl.NumberFormat` / `Intl.DateTimeFormat` 사용 (브라우저 네이티브)
- locale 매핑: `ko → 'ko-KR'`, `ja → 'ja-JP'`, `en → 'en-US'`

---

## 6. 환율 API

### 결정: Frankfurter API + Supabase 캐싱

**Frankfurter API:**
- URL: `https://api.frankfurter.dev/v1/`
- 무료, API 키 불필요, 속도 제한 없음
- 데이터 출처: 유럽중앙은행 (ECB), 매일 16:00 CET 업데이트
- 지원 통화: KRW, JPY, USD 등 32개
- 과거 환율 조회 가능 (1999년~)

**캐싱 전략:**
1. 거래 입력 시 해당 날짜의 환율 필요
2. `exchange_rate_cache` 테이블에서 캐시 확인
3. 없으면 Frankfurter API 호출 → 캐시 저장
4. API 장애 시 가장 최근 캐시된 환율 사용

**제한사항:**
- ECB 데이터 기반이라 영업일만 업데이트 (주말/공휴일은 직전 영업일 환율)
- 가계부 수준에서는 충분한 정확도

---

## 7. 정산 로직

### split_type별 계산

| split_type | 설명 | 결제자 부담 | 상대방 부담 |
|-----------|------|-----------|-----------|
| `50_50` | 반반 | 50% | 50% |
| `custom` | 커스텀 비율 | split_ratio% | (100 - split_ratio)% |
| `paid_for_self` | 본인 지출 | 100% | 0% |
| `paid_for_partner` | 상대방 대신 지출 | 0% | 100% |

**잔액 계산 예시:**
```
fairytooth가 ₩100,000 결제 (50:50) → maki가 ₩50,000 빚짐
maki가 ¥10,000 결제 (50:50) → fairytooth가 ¥5,000 빚짐
→ 환율 적용해서 통합 잔액 계산
```

모든 금액은 조회하는 유저의 `home_currency`로 통합 변환 후 잔액 산출.
