# HISTORY_SETTLEMENT - 정산 시스템 전면 개편 (Phase 6)

## 세션 5: 정산 시스템 전면 개편 (2026-02-12~13)

### 작업 요약

기존 정산 시스템(amount=0 placeholder, 잔액 미반영)을 완전히 재설계.
월 정산 + 건당 정산(일부 금액), 상호 확인(pending→confirmed), 취소 지원.

---

### 1. 설계 논의

#### 기존 문제점
- "정산하기" 버튼: `amount: 0`으로 빈 레코드만 생성
- `calculateBalance()`가 settlement 레코드를 전혀 참조하지 않음
- 상호 확인 없음 (한쪽이 누르면 바로 완료)

#### 설계 결정사항 (사용자와 논의)
1. **정산 통화**: 거래 시점 환율 재사용 (새 환율 조회 안 함)
2. **정산 수정**: 별도 편집 기능 대신 "취소 → 재생성" (감사 추적 자동 보존)
3. **상호 확인**: pending → confirmed/cancelled 상태 머신
4. **잔액 계산**: confirmed settlement_items만 반영, 거래별 기정산 차감
5. **데이터 모델**: settlements + settlement_items 2테이블 구조

---

### 2. DB 변경

#### 새 ENUM 타입
- `settlement_type`: 'monthly', 'per_transaction'
- `settlement_status`: 'pending', 'confirmed', 'cancelled'

#### settlements 테이블 변경
| 변경 | 내용 |
|------|------|
| 컬럼 추가 | type, status, confirmed_at, cancelled_at, cancelled_by |
| 이름 변경 | settled_by → requested_by, settled_to → requested_to, amount → total_amount |
| 기본값 | status DEFAULT 'pending' |

#### settlement_items 테이블 (신규)
- `id`, `settlement_id` FK, `transaction_id` FK, `amount`, `currency`, `created_at`
- 인덱스: settlement_id, transaction_id
- RLS: settlements JOIN을 통한 커플 멤버 확인

#### RLS 정책 변경
- settlements INSERT: `requested_by = auth.uid()` 조건 추가
- settlements UPDATE: 신규 (커플 멤버 누구나 confirm/cancel 가능)
- settlement_items SELECT/INSERT: settlements JOIN 기반

#### 마이그레이션
- 기존 테스트 데이터 3건(amount=0) 삭제
- `IF NOT EXISTS` / `IF EXISTS` 사용으로 중복 실행 안전
- 파일: `db/init/08.settlement_overhaul.sql`

---

### 3. 코드 변경 (레이어별)

#### 타입 (types/index.ts)
- 추가: `SettlementType`, `SettlementStatus`, `SettlementItem`, `SettlementItemRow`, `SettlementItemInput`
- 변경: `Settlement` (requestedBy/To, totalAmount, type, status, confirmedAt, cancelledAt/By)
- 변경: `SettlementInput` (type, totalAmount, items[])

#### 서비스 레이어 (services/supabase.ts)
- `toSettlement()`: 새 필드 매핑
- `toSettlementItem()`: 신규
- `fetchConfirmedItems(coupleId)`: confirmed settlement의 items 조회
- `fetchItemsBySettlement(settlementId)`: 특정 정산의 items
- `confirmSettlement(id)`: status='confirmed' + confirmed_at
- `cancelSettlement(id, cancelledBy)`: status='cancelled' + cancelled_at/by
- `createSettlement()`: settlement + settlement_items 동시 INSERT

#### 비즈니스 로직 (utils/settlement.ts) - 전면 재작성
- `calculateBalance()`: confirmedItems 파라미터 추가, 거래별 기정산 차감
- `getUnsettledTransactions()`: 미정산 거래 목록 + 잔여 금액 계산
- 헬퍼: `getAmountInDisplay()`, `getOtherShare()`, `settledToDisplay()`, `buildSettledMap()`

#### Hook (hooks/useSettlements.ts) - 전면 재작성
- 상태: settlements[], confirmedItems[], loading
- 파생: pendingForMe, pendingByMe (useMemo)
- 액션: addSettlement, confirmSettlement, cancelSettlement, getItems

#### UI 컴포넌트
| 컴포넌트 | 상태 | 내용 |
|----------|------|------|
| SettlementForm.tsx | **신규** | 월/건당 탭, 체크박스 선택, 일부 금액 입력, 역변환 |
| PendingSettlement.tsx | **신규** | 대기 중 정산 확인/거절 카드 |
| BalanceSummary.tsx | 수정 | confirmedItems를 calculateBalance에 전달 |
| SettlementHistory.tsx | 재작성 | 상태 뱃지, confirm/cancel 액션 버튼 |
| Settlement.tsx (페이지) | 재작성 | 전체 오케스트라: Pending → Balance → Form모달 → History |

#### i18n (en/ko/ja.json)
- ~20개 새 키: settlement.status.*, actions.*, newSettlement, monthly, perTransaction 등

---

### 4. 빌드 에러 수정

| 에러 | 원인 | 해결 |
|------|------|------|
| `TS6133: 'UnsettledTransaction' never read` | import했지만 타입 어노테이션 미사용 | import 줄 제거 |
| `TS6133: 'userId' never read` | getUnsettledTransactions에서 미사용 파라미터 | `_userId` prefix |
| `TS6133: 'partnerId' never read` | 동일 | `_partnerId` prefix |

---

### 5. DB 마이그레이션 실행

- Supabase REST API로 기존 데이터 조회 (settlements 3건, profiles 2명, transactions 5건)
- 직접 DB 연결 불가 (네트워크 차단) → 사용자가 SQL Editor에서 직접 실행
- REST API로 마이그레이션 성공 확인 (새 컬럼 인식, settlement_items 테이블 존재)

---

### 6. 실동작 테스트 결과

사용자가 직접 테스트:
- [x] 정산 요청 (건당)
- [x] 정산 수락 (상대방 확인)
- [x] 정산 취소
- [x] 히스토리 내역 확인

---

### 7. 문서 업데이트

| 파일 | 변경 |
|------|------|
| `doc/architecture.md` 섹션 7 | 레이어 다이어그램, 정산 모드, 상태 흐름, 데이터 모델, 잔액 알고리즘, 통화 처리 |
| `CLAUDE.md` | 폴더 구조, ENUM, 테이블, TypeScript 인터페이스, 정산 아키텍처, TODO Phase 6 완료 |

---

### 8. 전체 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `db/init/05.settlements.sql` | 재작성 | 새 스키마 (fresh install용) |
| `db/init/08.settlement_overhaul.sql` | **신규→재작성** | 마이그레이션 SQL (기존 DB용) |
| `src/types/index.ts` | 수정 | Settlement/SettlementItem 타입 |
| `src/services/supabase.ts` | 수정 | 정산 CRUD 6개 함수 |
| `src/utils/settlement.ts` | 재작성 | 잔액 계산 + 미정산 조회 |
| `src/hooks/useSettlements.ts` | 재작성 | 상태관리 + 파생값 |
| `src/components/settlement/SettlementForm.tsx` | **신규** | 정산 요청 폼 |
| `src/components/settlement/PendingSettlement.tsx` | **신규** | 대기 확인 카드 |
| `src/components/settlement/BalanceSummary.tsx` | 수정 | confirmedItems 전달 |
| `src/components/settlement/SettlementHistory.tsx` | 재작성 | 상태 뱃지 + 액션 |
| `src/pages/Settlement.tsx` | 재작성 | 페이지 오케스트라 |
| `src/i18n/locales/en.json` | 수정 | 정산 키 ~20개 |
| `src/i18n/locales/ko.json` | 수정 | 동일 |
| `src/i18n/locales/ja.json` | 수정 | 동일 |
| `doc/architecture.md` | 수정 | 섹션 7 재작성 |
| `CLAUDE.md` | 수정 | Phase 6 완료 + 스키마 업데이트 |
