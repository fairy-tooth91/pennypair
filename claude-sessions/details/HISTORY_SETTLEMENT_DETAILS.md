# HISTORY_SETTLEMENT_DETAILS - 정산 시스템 전면 개편 상세 기록

---

## 세션 5: 정산 시스템 전면 개편 (2026-02-12~13)

### Claude 판단 과정

**실작업 분석:**
- Read 도구: Settlement.tsx, supabase.ts, settlement.ts, SettlementForm.tsx, useSettlements.ts, architecture.md, CLAUDE.md, 08.settlement_overhaul.sql 등 핵심 파일 다수
- Write 도구: Settlement.tsx (페이지 재작성), 08.settlement_overhaul.sql (마이그레이션 재작성), HISTORY_SETTLEMENT.md (세션 기록)
- Edit 도구: settlement.ts (_userId prefix), SettlementForm.tsx (미사용 import 제거), CLAUDE.md (Phase 6 체크)
- Bash 도구: npm run build (빌드 검증), curl (Supabase REST API로 데이터 조회/마이그레이션 검증), npm install pg
- 시스템 변경: DB 마이그레이션 실행 (ENUM 2개, 테이블 ALTER + CREATE, RLS 정책 6개), 빌드 성공 확인

**세션 분류**: feature (정산 시스템 전면 재설계 + 구현 + DB 마이그레이션 + 테스트)

---

### 작업 흐름 (시간순)

#### Phase A: 이전 세션에서 계속 (컨텍스트 복원)
- 이전 세션에서 Step 1~6+8 완료, Step 7(페이지 재작성)과 빌드 확인이 남은 상태
- TodoWrite로 진행 상태 복원

#### Phase B: Step 7 - Settlement 페이지 재작성
- 기존 Settlement.tsx: 단순 버튼 1개 + 빈 정산 생성
- 새 Settlement.tsx: PendingSettlement 알림 + BalanceSummary + 정산요청 모달(SettlementForm) + SettlementHistory
- Modal 컴포넌트 재사용으로 정산 폼을 바텀시트 형태로 표시

#### Phase C: 빌드 검증 + TS 에러 수정
- `npm run build` 실행 → 3개 TS6133 에러 발견
- UnsettledTransaction import: 타입만 import했지만 어노테이션으로 안 씀 → 제거
- userId/partnerId: getUnsettledTransactions에서 시그니처에만 있고 본문 미사용
  - 사용자가 "뭐가 문제여서 삭제하는건대" 질문 → 상세 설명 제공
  - calculateBalance와 시그니처 일관성 유지를 위해 `_` prefix 방식 채택
- 재빌드 → 성공 (893KB bundle)

#### Phase D: DB 마이그레이션
- Supabase 직접 접근 시도:
  1. 사용자가 `sb_secret_...` 키 제공 → 이건 DB 비밀번호가 아닌 것으로 판명
  2. psql 설치 시도 → 네트워크에서 DB 호스트 접근 불가
  3. 사용자가 service_role JWT 제공 → REST API용, DDL 실행 불가
  4. 결론: 사용자가 SQL Editor에서 직접 실행하는 방식으로 전환

- REST API로 기존 데이터 전수 조회:
  - settlements: 3건 (전부 amount=0, 테스트 데이터)
  - profiles: woonyong(KRW), maki(JPY)
  - couples: 1건
  - transactions: 5건
  - settlement_items: 테이블 없음
  - settlements.type/status 컬럼: 없음

- 마이그레이션 SQL 재작성 (08.settlement_overhaul.sql):
  - 기존 테스트 데이터 DELETE 추가 (amount=0이라 의미 없음)
  - `IF NOT EXISTS` / `IF EXISTS` / `DO $$ EXCEPTION` 추가 (중복 실행 안전)
  - status 기본값을 'pending'으로 수정 (이전엔 'confirmed'이었음)
  - 확인용 주석 쿼리 추가

- 사용자가 SQL Editor에서 실행 후 REST API로 성공 확인

#### Phase E: 실동작 테스트 + 설계 논의
- 사용자가 정산 요청/수락/취소 테스트 완료
- "정산 수정은 어디서?" 질문 → 미구현 확인
- 설계 논의: 취소→재생성 vs 직접 편집
  - 사용자: "수정하면 내역이 남아야 할 것 같은데" → 좋은 포인트
  - 결론: 취소→재생성이 자동으로 감사 추적 제공, 별도 편집 기능 불필요
  - 사용자: "취소하면 내역이 남진 않잖아?" → cancelSettlement은 DELETE가 아닌 UPDATE(status='cancelled') 확인 → 내역 남음

#### Phase F: 문서화 + 세션 저장
- CLAUDE.md Phase 6 완료 체크
- 세션 저장 실행

---

### 주요 기술 결정 및 근거

**1. getUnsettledTransactions의 userId/partnerId 파라미터**
- 현재 미사용이지만 시그니처에 유지 (`_` prefix)
- 이유: calculateBalance와 시그니처 일관성, 향후 "누가 결제했는지" 필터 확장 가능
- 대안(파라미터 제거)도 가능했으나 호출부 수정 최소화를 위해 현재 방식 선택

**2. 마이그레이션 SQL 안전성**
- `IF NOT EXISTS` / `DROP ... IF EXISTS` 사용으로 멱등성 보장
- 기존 데이터가 전부 테스트용(amount=0)이므로 DELETE 후 깨끗한 마이그레이션
- 실 데이터가 있었다면 UPDATE ... SET status = 'confirmed' 방식이었을 것

**3. 정산 수정 = 취소 + 재생성**
- 금융 시스템 표준 패턴: void + re-create
- cancelled_at, cancelled_by 자동 기록 → 별도 감사 로그 불필요
- 구현 복잡도 최소화 (추가 UI/API 불필요)

---

### 사용자 소통 패턴

- 직접 테스트 후 기능 확인하는 스타일
- "뭐가 문제여서 삭제하는건대" → 변경 이유를 항상 설명해야 함
- "내역이 남아야할 듯하거든" → 비즈니스 관점에서 좋은 지적
- "문서 확인했을때 어디까지 된거지?" → 진행 상태 추적 중요시
- "일단 완료 처리하고 문서 최신화하고 세션 저장하고 커밋하자" → 체계적 마무리 선호

---

### Supabase 접속 관련 학습

- 이 서버 환경에서 Supabase PostgreSQL 직접 연결 불가 (포트 5432 네트워크 차단)
- REST API (service_role JWT): 테이블 CRUD만 가능, DDL(ALTER/CREATE) 불가
- SQL 실행이 필요한 마이그레이션은 사용자가 Supabase Dashboard SQL Editor에서 직접 실행
- REST API는 데이터 조회/검증 용도로 활용 가능
