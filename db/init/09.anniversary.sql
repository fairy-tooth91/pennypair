-- PennyPair: 09. 기념일/생일 컬럼 추가
-- 기존 DB에 실행하는 마이그레이션 SQL
-- 실행 순서: 기존 08.settlement_overhaul.sql 적용 후
-- 실행 일시: 2026-02-13
--
-- 추가 내용:
--   couples.anniversary_date — 사귀기 시작한 날
--   profiles.birthday — 각자 생일

-- ============================================
-- 1. couples 테이블: anniversary_date 추가
-- ============================================
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS anniversary_date DATE;

COMMENT ON COLUMN public.couples.anniversary_date IS '커플 사귀기 시작한 날 (YYYY-MM-DD)';

-- ============================================
-- 2. profiles 테이블: birthday 추가
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE;

COMMENT ON COLUMN public.profiles.birthday IS '유저 생일 (YYYY-MM-DD)';

-- ============================================
-- 3. couples UPDATE RLS 정책 추가
-- ============================================
-- 기존에 SELECT 정책만 있어서 UPDATE 불가 → 커플 멤버가 업데이트 가능하도록
CREATE POLICY "couples_update_own"
  ON public.couples FOR UPDATE
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================
-- 완료 확인
-- ============================================
-- 실행 후 확인:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'couples' AND column_name = 'anniversary_date';
--
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name = 'birthday';
