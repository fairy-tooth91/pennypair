# HISTORY_REALTEST - 실동작 테스트 + 버그 수정 + 기능 개선

## 세션 4: 실동작 테스트 기반 개선 (2026-02-12)

### 작업 요약

실제 데이터 입력하며 발견한 버그 수정 + UX 개선 + DB 스키마 확장

---

### 1. 브랜치 전략 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 작업 브랜치 | master 직접 | develop |
| 배포 브랜치 | gh-pages | master (Vercel 자동 배포) |
| 워크플로우 | - | develop 작업 → master 머지 → 자동 배포 |

---

### 2. 버그 수정 (7건)

#### 2-1. SPA 북마크/새로고침 404
- **증상**: 브라우저 북마크 또는 새로고침 시 404
- **원인**: Vercel에 SPA 리다이렉트 규칙 없음
- **수정**: `vercel.json` 신규 생성
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

#### 2-2. 거래 저장 실패 (RLS 정책)
- **증상**: 상대방을 결제자로 지정하면 저장 안 됨
- **원인**: INSERT 정책이 `paid_by = auth.uid()` — 로그인 유저만 결제자 가능
- **수정**: RLS 정책 변경 → `paid_by IN (커플 멤버)`
- **실행 SQL**: `DROP POLICY` 5개 + `CREATE POLICY` 4개

#### 2-3. 수정 시 새 거래 생성
- **증상**: 거래 수정 버튼 누르면 수정이 아니라 새 거래 추가
- **원인**: `Transactions.tsx`에서 `editingTx` 여부와 무관하게 항상 `addTransaction` 호출
- **수정**: `editingTx` 있으면 `editTransaction` 호출

#### 2-4. 상대방 결제 거래 수정/삭제 불가
- **증상**: 상대방이 결제한 거래에 수정/삭제 버튼 없음
- **원인**: `TransactionList`에서 `isOwn` 체크로 본인 거래만 수정/삭제 허용
- **수정**: `isOwn` 제한 제거 (커플 공유 앱이므로 양쪽 모두 수정 가능)

#### 2-5. 정산 통화 오류 (¥ → ₩)
- **증상**: ¥3333 입력했는데 정산에서 ₩3333으로 표시
- **원인 1**: `useTransactions.ts` — 항상 파트너 통화로만 변환. 입력 통화가 파트너 통화와 같으면 변환 안 됨
- **원인 2**: `settlement.ts` — 변환 불가 시 원본 금액 그대로 사용 (통화 무시)
- **수정**: 변환 대상을 "상대방 통화"가 아닌 "다른 쪽 홈 통화"로 변경 + 변환 불가 시 정산에서 제외

#### 2-6. 정산 금액 계산 오류
- **증상**: 커스텀 분담(paid_for_partner 등)에서 정산 금액이 맞지 않음
- **원인**: `settlement.ts`에서 `balance -= payerShare` → 결제자 몫이 아닌 **상대방 몫**으로 계산해야 함
- **수정**: `balance -= otherShare`로 변경

#### 2-7. 수입에 "반반" 표시
- **증상**: 수입 거래에 분담 유형(반반) 표시
- **원인**: TransactionList에서 type 구분 없이 모든 거래에 splitType 표시
- **수정**: `tx.type === 'expense'` 조건 추가

---

### 3. UX 개선 (5건)

#### 3-1. 파트너 표시 + 결제자 선택
- **Layout.tsx 헤더**: "PennyPair" 옆에 "with {파트너이름}" 표시
- **TransactionForm.tsx**: 결제자 토글 버튼 추가 (나 / 파트너)
- **i18n**: `transaction.paidBy`, `transaction.me` 키 추가 (ko/ja/en)

#### 3-2. 거래 목록 확장형 액션
- **변경 전**: 작은 ✕ 버튼으로 삭제만 가능
- **변경 후**: 거래 항목 탭 → 상세 정보 + 수정/삭제 버튼 표시 (아코디언)

#### 3-3. 모달 크기 제한
- `max-height: 85vh` + 콘텐츠 영역 스크롤 가능
- 헤더 고정 (shrink-0)

#### 3-4. 커스텀 분담 UX 개선
- **비율(%) / 금액 모드 토글** 추가
- **이름 표시**: 결제자 이름 + 입력 필드, 상대방 이름 + 자동 계산 표시
- **모드 전환 시 값 동기화**: % → 금액, 금액 → %

#### 3-5. 거래 상세보기
- 거래 목록에서 항목 탭 시 확장 영역에 상세 정보 표시:
  - 결제자, 날짜, 분담 유형
  - 커스텀 분담 상세 (금액 or 비율, 각자 부담분)
  - 변환 금액, 환율
  - 메모 (전체)
- 하단에 수정/삭제 버튼

---

### 4. DB 스키마 확장: split_amount

#### 배경
커스텀 분담에서 비율(%)만 저장하면 정확한 금액 보존 불가
- 예: 1000원 중 238원 → 23.8% → 반올림 24% → 역산 240원 (오차 발생)

#### 변경 내용

**DB 마이그레이션:**
```sql
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS split_amount NUMERIC(15, 2);
COMMENT ON COLUMN public.transactions.split_amount IS '결제자 부담 금액 (금액 모드 입력 시)';
```

**동작 방식:**

| 입력 모드 | split_ratio | split_amount | 정산 계산 |
|-----------|-------------|--------------|-----------|
| 비율 (60%) | 60 | NULL | `amount * (1 - 60/100)` |
| 금액 (238원) | 23.8 (참고용) | 238 | `amount * (1 - 238/amount)` |
| 반반 | 50 | NULL | `amount * 0.5` |
| 본인 지출 | 100 | NULL | 0 |
| 상대방 대신 | 0 | NULL | amount |

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `db/init/04.transactions.sql` | `split_amount NUMERIC(15, 2)` 컬럼 추가 |
| `src/types/index.ts` | Transaction, TransactionRow, TransactionInput에 `splitAmount` 추가 |
| `src/services/supabase.ts` | toTransaction, createTransaction, updateTransaction 매핑 추가 |
| `src/components/transaction/TransactionForm.tsx` | 금액 모드일 때 `splitAmount` 전송, 수정 시 `splitAmount`로 모드 자동 감지 |
| `src/utils/settlement.ts` | `splitAmount` 우선 사용, 없으면 `splitRatio` 폴백 |
| `src/components/transaction/TransactionList.tsx` | 상세보기에서 금액/비율 구분 표시 |

---

### 5. 전체 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `vercel.json` | **신규** | SPA 리라이트 규칙 |
| `CLAUDE.md` | 수정 | 브랜치 전략 업데이트 |
| `db/init/04.transactions.sql` | 수정 | RLS 정책 + split_amount 컬럼 |
| `src/types/index.ts` | 수정 | paidBy, splitAmount 필드 추가 |
| `src/services/supabase.ts` | 수정 | paidBy, splitAmount 매핑 |
| `src/hooks/useTransactions.ts` | 수정 | paidBy 처리, 통화 변환 로직 수정 |
| `src/utils/settlement.ts` | 수정 | 통화 변환 + otherShare 수정 + splitAmount 지원 |
| `src/components/common/Layout.tsx` | 수정 | 파트너 이름 표시 |
| `src/components/common/Modal.tsx` | 수정 | max-height 85vh + 스크롤 |
| `src/components/transaction/TransactionForm.tsx` | 수정 | 결제자 토글 + 에러 표시 + 커스텀 분담 UX + splitAmount |
| `src/components/transaction/TransactionList.tsx` | 수정 | 확장형 상세보기 + 수정/삭제 + 분담 표시 |
| `src/pages/Transactions.tsx` | 수정 | editTransaction 연결 |
| `src/i18n/locales/ko.json` | 수정 | paidBy, me, exchangeRate, convertedAmount 키 |
| `src/i18n/locales/en.json` | 수정 | 동일 |
| `src/i18n/locales/ja.json` | 수정 | 동일 |

---

### 6. 미완료 / 다음 단계

- [ ] **DB 마이그레이션 실행**: `ALTER TABLE ... ADD COLUMN split_amount` (Supabase SQL Editor)
- [ ] **develop → master 머지 후 배포**
- [ ] **실동작 테스트**: split_amount 저장/조회/정산 계산 검증
- [ ] **기존 커스텀 거래 데이터**: split_amount = NULL 상태 → 비율 기반으로 정상 동작 확인
