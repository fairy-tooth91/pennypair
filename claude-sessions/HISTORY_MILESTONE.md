# Phase 7: 기념일/생일 마일스톤 기능

## 세션 정보
- **날짜**: 2026-02-13
- **Phase**: 7 (기념일/생일 마일스톤 + UI 보완)

## 작업 내용

### 기능 개요
커플 앱다운 감성 기능 추가. 3가지 중요한 날짜를 관리:
1. 사귀기 시작한 날 (couples.anniversary_date)
2. 내 생일 (profiles.birthday)
3. 파트너 생일 (profiles.birthday)

### 설계 결정
- **별도 milestones 테이블 없음** — 모든 마일스톤은 anniversary_date에서 순수 함수로 계산
- **couples.anniversary_date + profiles.birthday** — 각각 적합한 테이블에 DATE 컬럼 추가
- **축하 중복 방지** — localStorage에 확인한 마일스톤 기록
- **CSS-only 파티클** — 외부 라이브러리 없이 CSS 애니메이션으로 축하 연출
- **백엔드/프론트엔드 완전 분리** — Phase B(데이터) → Phase C(UI) 순서

### 마일스톤 목록
- 일수: 100일, 200일, 300일, 500일, 1000일, 2000일, 3000일
- 연수: 1주년, 2주년, 3주년, 4주년, 5주년, ...
- 생일: 매년 반복

### 수정 파일
**백엔드 (Phase B):**
- db/init/09.anniversary.sql (신규)
- src/types/index.ts
- src/services/supabase.ts
- src/utils/milestone.ts (신규)
- src/context/CoupleContext.tsx

**프론트엔드 (Phase C):**
- src/i18n/locales/{ko,en,ja}.json
- src/components/dashboard/AnniversaryCard.tsx (신규)
- src/components/dashboard/CelebrationModal.tsx (신규)
- src/pages/Settings.tsx
- src/pages/Dashboard.tsx

## 진행 상태
- [x] Phase A: 문서화
- [x] Phase B: 백엔드 (타입, 서비스, 유틸리티, Context)
- [x] Phase C: 프론트엔드 (i18n, AnniversaryCard, CelebrationModal, Settings, Dashboard)
- [x] Phase D: 빌드 검증 통과
- [ ] DB 마이그레이션 실행 (Supabase SQL Editor에서 09.anniversary.sql 실행 필요)
