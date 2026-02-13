-- PennyPair: 05. settlements + settlement_items 테이블
-- 실행 순서: 02.couples.sql, 04.transactions.sql 이후
-- 참고: ENUM 타입 (settlement_type, settlement_status)은 여기서 생성

-- ============================================
-- ENUM 타입 (신규 설치 시 중복 방지)
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
-- settlements 테이블 (정산 이벤트)
-- ============================================

CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type settlement_type NOT NULL DEFAULT 'per_transaction',
  status settlement_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  requested_to UUID NOT NULL REFERENCES public.profiles(id),
  total_amount NUMERIC(15, 2) NOT NULL,
  currency currency_code NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  memo VARCHAR(500) DEFAULT '',
  settled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id),
  CONSTRAINT settlement_different_users CHECK (requested_by <> requested_to)
);

COMMENT ON TABLE public.settlements IS '커플 간 정산 이벤트';
COMMENT ON COLUMN public.settlements.type IS '정산 유형: monthly(월별), per_transaction(건별)';
COMMENT ON COLUMN public.settlements.status IS '정산 상태: pending(대기), confirmed(확인), cancelled(취소)';
COMMENT ON COLUMN public.settlements.requested_by IS '정산 요청자';
COMMENT ON COLUMN public.settlements.requested_to IS '정산 확인 대상 (상대방)';
COMMENT ON COLUMN public.settlements.total_amount IS '총 정산 금액';
COMMENT ON COLUMN public.settlements.period_start IS '정산 대상 기간 시작일';
COMMENT ON COLUMN public.settlements.period_end IS '정산 대상 기간 종료일';

-- ============================================
-- settlement_items 테이블 (정산 상세 - 거래별)
-- ============================================

CREATE TABLE public.settlement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  currency currency_code NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.settlement_items IS '정산 상세 항목 (거래별 정산 금액)';
COMMENT ON COLUMN public.settlement_items.amount IS '이 거래에 대한 정산 금액 (거래 원본 통화 기준)';

-- ============================================
-- 인덱스
-- ============================================

CREATE INDEX idx_settlements_couple ON public.settlements(couple_id, settled_at DESC);
CREATE INDEX idx_settlement_items_settlement ON public.settlement_items(settlement_id);
CREATE INDEX idx_settlement_items_transaction ON public.settlement_items(transaction_id);

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

-- settlements: SELECT
CREATE POLICY "settlements_select_couple"
  ON public.settlements FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- settlements: INSERT (요청자만)
CREATE POLICY "settlements_insert_couple"
  ON public.settlements FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

-- settlements: UPDATE (커플 멤버 - confirm/cancel용)
CREATE POLICY "settlements_update_couple"
  ON public.settlements FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- settlement_items: SELECT
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

-- settlement_items: INSERT
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
