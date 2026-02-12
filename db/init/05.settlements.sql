-- PennyPair: 05. settlements 테이블
-- 실행 순서: 02.couples.sql 이후

CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  settled_by UUID NOT NULL REFERENCES public.profiles(id),
  settled_to UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(15, 2) NOT NULL,
  currency currency_code NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  memo VARCHAR(500) DEFAULT '',
  settled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settlement_different_users CHECK (settled_by <> settled_to)
);

COMMENT ON TABLE public.settlements IS '커플 간 정산 기록';
COMMENT ON COLUMN public.settlements.settled_by IS '정산 시작자 (돈을 보낸 사람)';
COMMENT ON COLUMN public.settlements.settled_to IS '정산 수신자 (돈을 받은 사람)';
COMMENT ON COLUMN public.settlements.period_start IS '정산 대상 기간 시작일';
COMMENT ON COLUMN public.settlements.period_end IS '정산 대상 기간 종료일';

-- ============================================
-- 인덱스
-- ============================================

CREATE INDEX idx_settlements_couple ON public.settlements(couple_id, settled_at DESC);

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements_select_couple"
  ON public.settlements FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "settlements_insert_couple"
  ON public.settlements FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
    AND settled_by = auth.uid()
  );
