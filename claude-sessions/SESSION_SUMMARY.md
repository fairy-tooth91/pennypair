# PennyPair - 세션 요약

## 현재 상태

**프로젝트 단계**: Step 4 진행 중 (실동작 테스트 + 버그 수정 + 기능 개선)

**완료된 작업:**
- Step 1: 프로젝트 초기화 + 아키텍처 설계 + 문서화 + DB SQL 7개
- Step 2: SQL RLS 버그 수정 + Supabase DB 실행 완료 + Vite 스캐폴딩 + 전체 소스코드 30+ 파일 + 빌드 성공
- Step 3: 유저 가입 + 커플 연결 + 로그인 디버깅 + Profile Bottom Sheet + FAB 위치 수정 + Vercel 배포
- Step 4: 실동작 테스트 기반 버그 7건 수정 + UX 개선 5건 + split_amount DB 확장 (미배포)

**배포 URL**: https://pennypair.vercel.app
**브랜치 전략**: develop (작업) → master (배포, Vercel 자동)

**유저 정보:**
- woonyong (KRW, ko): `f55bd938-d5a4-44cf-bb8b-df6226d2a0b2`
- maki (JPY, ja): `0441e872-1c5b-4486-b88e-8e997a4d55de`

**미완료 작업:**
1. DB 마이그레이션 실행: `ALTER TABLE transactions ADD COLUMN split_amount NUMERIC(15,2)`
2. develop → master 머지 후 Vercel 배포
3. split_amount 저장/조회/정산 실동작 검증
4. 데스크톱 반응형 레이아웃 대응

---

## 프로젝트 개요

국제 커플(한국-일본) 공유 가계부 웹앱
- **핵심 기능**: 이중 통화 자동 변환 (KRW↔JPY), 커플 간 정산, 한/일/영 다국어
- **기술 스택**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Supabase + Recharts
- **환율 API**: Frankfurter API (무료, 키 불필요)
- **인증**: Supabase Auth (이메일/비밀번호)

---

## 현재 스펙: 커스텀 분담 시스템

### split_type (ENUM)

| 값 | 의미 | 정산 계산 |
|----|------|-----------|
| `50_50` | 반반 | `amount * 0.5` |
| `custom` | 커스텀 비율/금액 | 아래 참조 |
| `paid_for_self` | 본인 지출 | 0 (정산 불필요) |
| `paid_for_partner` | 상대방 대신 | `amount` 전액 |

### custom 분담 상세

| 입력 모드 | DB 저장 | 정산 계산 (상대방 몫) |
|-----------|---------|----------------------|
| 비율 60% | `split_ratio=60, split_amount=NULL` | `amount * (1 - 60/100)` |
| 금액 238원 | `split_ratio=23.8, split_amount=238` | `amount * (1 - 238/amount)` |

- `split_amount`가 NULL이 아니면 금액 모드 → 정확한 금액 기반 정산
- `split_amount`가 NULL이면 비율 모드 → `split_ratio` 기반 정산
- `split_ratio`는 비율 모드에서 직접 사용, 금액 모드에서는 참고용으로 저장

### 정산 통화 변환 우선순위

1. `tx.currency === displayCurrency` → 원본 금액 사용
2. `tx.convertedCurrency === displayCurrency` → 변환 금액 사용
3. `tx.exchangeRate != null` → 역변환 계산
4. 변환 불가 → 정산에서 제외 (continue)

---

## 현재 스펙: 거래 입력/표시

### TransactionForm 입력 필드
- 날짜, 결제자 (나/파트너 토글), 유형 (수입/지출)
- 카테고리 (그리드 선택), 금액 + 통화
- 환율 정보 표시 (자동 변환 미리보기)
- 분담 유형 (지출만): 반반, 커스텀, 본인 지출, 상대방 대신
- 커스텀: % / 금액 모드 토글, 결제자 이름 + 입력, 상대방 이름 + 자동 계산
- 메모

### TransactionList 상세보기 (확장 영역)
- 결제자, 날짜, 분담 유형 (지출만)
- 커스텀 분담 상세: 금액이면 "이름 238원 / 이름 762원", 비율이면 "이름 60% / 이름 40%"
- 변환 금액, 환율 (있을 때만)
- 메모 (전체, truncate 없음)
- 하단: 수정 / 삭제 버튼

---

## 핵심 설계 결정

1. **couple_id 기준 데이터 스코프** (user_id 아님) - 커플 공유 앱
2. **거래 시점 환율 영구 저장** - 과거 금액 변동 방지
3. **PostgreSQL ENUM 타입** - currency_code, language_code, transaction_type, split_type
4. **AuthContext / CoupleContext 분리** - 인증 → 데이터 순서 보장
5. **서비스 레이어 패턴** - supabase.ts에 CRUD 집중, 백엔드 교체 용이
6. **Frontend-only MVP** - Supabase RLS로 보안
7. **split_amount + split_ratio 공존** - 금액 모드는 정확한 금액 보존, 비율 모드는 기존 방식 유지

---

## 참조 파일

| 문서 | 내용 |
|------|------|
| `claude-sessions/HISTORY_SETUP.md` | 세션 1-2: 설계 + 구현 |
| `claude-sessions/HISTORY_UI_DEPLOY.md` | 세션 3: UI 개선 + Vercel 배포 |
| `claude-sessions/HISTORY_REALTEST.md` | 세션 4: 실동작 테스트 + 버그 수정 + split_amount |
| `claude-sessions/details/HISTORY_SETUP_DETAILS.md` | 세션 1-2 상세 |
| `claude-sessions/details/HISTORY_UI_DEPLOY_DETAILS.md` | 세션 3 상세 |

---

## 해결된 이슈 (세션 1-4 누적)

1. SQL RLS 순서 의존성 → RLS를 `02.couples.sql`로 이동
2. verbatimModuleSyntax → `import type` 사용
3. Supabase Email Confirmation → 비활성화 + 유저 재생성
4. GitHub Pages SPA 404 → Vercel 이전
5. FAB 버튼 데스크톱 위치 → 콘텐츠 영역 내 고정
6. SPA 북마크 404 → `vercel.json` 리라이트 규칙
7. 거래 저장 RLS 차단 → `paid_by IN (커플 멤버)` 정책
8. 수정 시 새 거래 생성 → `editingTx` 분기 처리
9. 상대방 거래 수정/삭제 불가 → `isOwn` 제한 제거
10. 정산 통화 오류 (¥→₩) → 변환 대상 "다른 쪽 홈 통화"로 변경
11. 정산 금액 오류 → `payerShare` → `otherShare` 수정
12. 수입에 분담 유형 표시 → `expense` 조건 추가
