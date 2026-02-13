-- PennyPair: 08. 정산 시스템 마이그레이션
-- 기존 DB에 실행하는 마이그레이션 SQL
-- 실행 순서: 기존 05.settlements.sql 적용 후
-- 실행 일시: 2026-02-12
--
-- 기존 상태:
--   settlements 3건 (전부 amount=0 테스트 데이터 → 삭제)
--   settlement_items 테이블 없음
--   settlement_type, settlement_status ENUM 없음

-- ============================================
-- 0. 기존 테스트 데이터 삭제
-- ============================================
-- 기존 settlements 3건 모두 amount=0 테스트 데이터
-- ID: 99558ffc-..., 29108fb4-..., 78365b1f-...
DELETE FROM public.settlements;

-- ============================================
-- 1. 새 ENUM 타입 생성
-- ============================================
DO $$ BEGIN
  CREATE TYPE settlement_type AS ENUM ('monthly', 'per_transaction');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE settlement_status AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. settlements 테이블 확장
-- ============================================

-- 새 컬럼 추가
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS type settlement_type NOT NULL DEFAULT 'monthly';
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS status settlement_status NOT NULL DEFAULT 'pending';
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id);

-- 컬럼 이름 변경 (settled_by → requested_by, settled_to → requested_to, amount → total_amount)
ALTER TABLE public.settlements RENAME COLUMN settled_by TO requested_by;
ALTER TABLE public.settlements RENAME COLUMN settled_to TO requested_to;
ALTER TABLE public.settlements RENAME COLUMN amount TO total_amount;

-- 기존 제약 조건 업데이트 (컬럼 이름 변경 반영)
ALTER TABLE public.settlements DROP CONSTRAINT IF EXISTS settlement_different_users;
ALTER TABLE public.settlements ADD CONSTRAINT settlement_different_users CHECK (requested_by <> requested_to);

-- ============================================
-- 3. settlement_items 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS public.settlement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  currency currency_code NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.settlement_items IS '정산 상세 항목 (거래별 정산 금액)';
COMMENT ON COLUMN public.settlement_items.amount IS '이 거래에 대한 정산 금액 (거래 원본 통화 기준)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement ON public.settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_transaction ON public.settlement_items(transaction_id);

-- ============================================
-- 4. RLS 정책 업데이트
-- ============================================

-- settlement_items RLS
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlement_items_select_couple"
  ON public.settlement_items FOR SELECT
  USING (
    settlement_id IN (
      SELECT s.id FROM public.settlements s
      WHERE s.couple_id IN (
        SELECT id FROM public.couples
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
      )
    )
  );

CREATE POLICY "settlement_items_insert_couple"
  ON public.settlement_items FOR INSERT
  WITH CHECK (
    settlement_id IN (
      SELECT s.id FROM public.settlements s
      WHERE s.couple_id IN (
        SELECT id FROM public.couples
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
      )
    )
  );

-- settlements: 기존 INSERT 정책 교체 (컬럼 이름 변경 반영)
DROP POLICY IF EXISTS "settlements_insert_couple" ON public.settlements;

CREATE POLICY "settlements_insert_couple"
  ON public.settlements FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

-- settlements: UPDATE 정책 추가 (파트너가 confirm/cancel 가능)
DROP POLICY IF EXISTS "settlements_update_couple" ON public.settlements;

CREATE POLICY "settlements_update_couple"
  ON public.settlements FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ============================================
-- 완료 확인
-- ============================================
-- 실행 후 확인:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'settlements' ORDER BY ordinal_position;
--
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'settlement_items' ORDER BY ordinal_position;
