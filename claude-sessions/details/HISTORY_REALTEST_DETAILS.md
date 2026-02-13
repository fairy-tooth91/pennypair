# HISTORY_REALTEST_DETAILS - 실동작 테스트 + 버그 수정 + 기능 개선 상세 기록

---

## 세션 4: 실동작 테스트 기반 개선 (2026-02-12)

### 🔍 Claude 판단 과정

**실작업 분석:**
- Read 도구: settlement.ts, types/index.ts, supabase.ts, TransactionForm.tsx, TransactionList.tsx 등 핵심 파일 분석
- Edit 도구: 15+ 파일 수정 (타입, 서비스, 폼, 리스트, 정산, DB SQL, i18n 등)
- Write 도구: vercel.json 신규 생성
- Bash 도구: git commit, git merge, git push, npm run build
- 시스템 변경: DB 스키마 확장 (split_amount 컬럼), RLS 정책 5개 재작성, Vercel 배포

**세션 분류**: feature + bugfix (split_amount 기능 확장 + 버그 7건 수정 + UX 5건 개선)

---

### 📋 작업 흐름

#### 1단계: 브랜치 전략 변경

- master에서 develop 브랜치 생성
- 워크플로우: develop (작업) → master (머지) → Vercel 자동 배포
- 이전: master 직접 작업 + GitHub Pages

#### 2단계: SPA 북마크 404 수정

**문제**: Vercel 배포 후 브라우저 새로고침/북마크 시 404
**원인**: Vercel에 SPA 리다이렉트 규칙 없음
**해결**: `vercel.json` 신규 생성
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

#### 3단계: RLS 정책 전면 재작성

**문제**: 상대방을 결제자로 지정하면 거래 저장 실패
**원인**: INSERT 정책이 `paid_by = auth.uid()` — 자기 자신만 결제자 가능
**해결**: RLS 정책 5개 DROP 후 4개 재생성
- INSERT: `paid_by IN (user1_id, user2_id)` — 커플 멤버 중 누구나 결제자 가능
- SELECT/UPDATE/DELETE: `couple_id` 기반 (변경 없음)

**Claude 사고 과정:**
- 커플 가계부 특성상 상대방 대신 결제 기록하는 경우 필수
- "paid_for_partner" 분담 유형이 있으므로 결제자 제한은 UX 모순

#### 4단계: 거래 CRUD 버그 수정

**수정 시 새 거래 생성:**
- `Transactions.tsx`에서 `editingTx` 분기 없이 항상 `addTransaction` 호출
- 수정: `editingTx ? editTransaction(editingTx.id, input) : addTransaction(input)`

**상대방 거래 수정/삭제 불가:**
- `TransactionList`에서 `isOwn` 체크로 액션 버튼 숨김
- 커플 공유 앱이므로 양쪽 모두 수정 가능해야 함
- `isOwn` 제한 제거

**수입에 분담 유형 표시:**
- `tx.type === 'expense'` 조건 누락
- splitType 표시에 expense 조건 추가

#### 5단계: 정산 로직 수정 (2건)

**통화 오류 (¥ → ₩):**
- 문제: ¥3333 입력 → 정산에서 ₩3333으로 표시
- 원인 1: `useTransactions.ts` — 항상 파트너의 홈 통화로만 변환. 입력 통화가 파트너 통화와 같으면 변환 스킵
- 원인 2: `settlement.ts` — 변환 불가 시 원본 금액 그대로 사용 (통화 무시)
- 해결: 변환 대상을 "다른 쪽 홈 통화"로 변경 + 변환 불가 시 continue (정산 제외)

**금액 계산 오류:**
- 문제: 커스텀 분담에서 정산 금액 불일치
- 원인: `balance -= payerShare` → 결제자 몫이 아닌 **상대방 몫**으로 계산해야 함
- 해결: payerShare 변수를 otherShare로 리네이밍 + 계산 로직 재검증

**정산 통화 변환 우선순위 (최종):**
1. `tx.currency === displayCurrency` → 원본 금액
2. `tx.convertedCurrency === displayCurrency` → 변환 금액
3. `tx.exchangeRate != null` → 역변환 계산
4. 변환 불가 → `continue` (정산 제외)

#### 6단계: UX 개선 5건

**파트너 표시 + 결제자 선택:**
- Layout.tsx 헤더: "PennyPair" 옆에 "with {파트너이름}"
- TransactionForm: 나/파트너 토글 버튼 추가
- i18n: `transaction.paidBy`, `transaction.me` 키 (ko/ja/en)

**거래 목록 확장형 액션:**
- 변경 전: 작은 ✕ 버튼으로 삭제만
- 변경 후: 탭 → 아코디언 (상세 + 수정/삭제)

**모달 크기 제한:**
- `max-height: 85vh` + 콘텐츠 스크롤
- 헤더 shrink-0 고정

**커스텀 분담 UX:**
- 비율(%) / 금액 모드 토글
- 이름 표시: 결제자 + 입력, 상대방 + 자동 계산
- 모드 전환 시 값 동기화

**거래 상세보기:**
- 확장 영역: 결제자, 날짜, 분담 유형, 커스텀 상세, 환율, 메모
- 하단: 수정/삭제 버튼

#### 7단계: split_amount 풀스택 구현

**배경 - 사용자 핵심 지적:**
- "총금액 1000인데 238/762면 비율을 어떻게 하려고???"
- 238/1000 = 23.8% → 반올림 24% → 역산 240원 (오차 2원)
- 비율만으로는 정확한 금액 보존 불가

**사용자 설계 관련 대화:**
- Claude: "비율을 삭제하고 금액만 쓰자"
- 사용자: "비율 저장도 있으니까 그걸 삭제하면 안되지... 설계 안해봤어...?"
- 결론: split_ratio + split_amount 공존 (각자 역할 분리)

**DB 마이그레이션:**
```sql
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS split_amount NUMERIC(15, 2);
COMMENT ON COLUMN public.transactions.split_amount IS '결제자 부담 금액 (금액 모드 입력 시)';
```

**풀스택 수정 내역:**

| 레이어 | 파일 | 변경 |
|--------|------|------|
| DB | `04.transactions.sql` | `split_amount NUMERIC(15,2)` 추가 |
| 타입 | `types/index.ts` | Transaction, TransactionRow, TransactionInput에 splitAmount 추가 |
| 서비스 | `supabase.ts` | toTransaction, createTransaction, updateTransaction 매핑 |
| 폼 | `TransactionForm.tsx` | customMode state, splitAmount 전송, 수정 시 모드 자동 감지 |
| 정산 | `settlement.ts` | splitAmount 우선, splitRatio 폴백 |
| 리스트 | `TransactionList.tsx` | 금액 vs 비율 구분 표시 |

**동작 방식:**
- `split_amount = NULL` → 비율 모드 (split_ratio 사용)
- `split_amount != NULL` → 금액 모드 (split_amount 기반 정확 계산)
- split_ratio는 비율 모드에서 직접 사용, 금액 모드에서는 참고용 저장

**정산 계산 (settlement.ts):**
```typescript
case 'custom':
  if (tx.splitAmount != null) {
    otherShare = amount * (1 - tx.splitAmount / tx.amount);  // 금액 기반
  } else {
    otherShare = amount * (1 - tx.splitRatio / 100);         // 비율 기반
  }
```

**폼 모드 자동 감지 (TransactionForm.tsx):**
```typescript
const [customMode, setCustomMode] = useState<'percent' | 'amount'>(
  initial?.splitAmount != null ? 'amount' : 'percent'
);
```

#### 8단계: 커밋 + 배포

- develop에서 커밋: `9ef1fc9 feat: 실동작 테스트 기반 버그 수정 + 커스텀 분담 개선`
- develop → master 머지
- git push → Vercel 자동 배포
- DB 마이그레이션: 사용자가 Supabase SQL Editor에서 실행

---

### 🧠 Claude 사고 과정 기록

**정산 로직 디버깅:**
- settlement.ts의 변수명이 payerShare였으나 실제로는 otherShare를 계산하고 있었음
- 변수 리네이밍만으로 버그 수정 + 코드 가독성 향상

**split_amount 설계 토론:**
- 처음에 split_ratio 삭제를 제안 → 사용자에게 거부당함
- 사용자의 "설계 안 해봤어...?" 지적 → 기존 데이터 호환성 중요
- 최종: NULL 여부로 모드 구분하는 심플한 설계 채택
- 교훈: 기존 필드를 삭제하기보다 확장하는 방향이 안전

**사용자 소통 스타일:**
- "설명을 하면서 진행해라" → 변경 전 설명 먼저
- 임시방편 거부, 정석적 해결 선호
- 한국어 커밋 메시지 선호

**커스텀 분담 값 동기화 이슈:**
- 모드 전환 시 (% ↔ 금액) 값 불일치
- 총 금액 변경 시 커스텀 금액 미동기화
- 3차 수정 후 안정화: onChange에서 양방향 동기화 + 모드 토글 시 변환
