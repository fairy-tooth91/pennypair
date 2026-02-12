-- PennyPair: 04. transactions 테이블
-- 실행 순서: 02.couples.sql, 03.categories.sql 이후

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  date DATE NOT NULL,
  type transaction_type NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  -- 원본 통화
  amount NUMERIC(15, 2) NOT NULL,
  currency currency_code NOT NULL,
  -- 변환 통화 (상대방 기준)
  converted_amount NUMERIC(15, 2),
  converted_currency currency_code,
  exchange_rate NUMERIC(18, 8),
  -- 정산 정보
  split_type split_type NOT NULL DEFAULT '50_50',
  split_ratio NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
  split_amount NUMERIC(15, 2),
  memo VARCHAR(500) DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.transactions IS '거래 기록 (이중 통화 + 정산 정보 포함)';
COMMENT ON COLUMN public.transactions.amount IS '원본 금액 (입력한 통화)';
COMMENT ON COLUMN public.transactions.converted_amount IS '상대방 통화로 변환된 금액';
COMMENT ON COLUMN public.transactions.exchange_rate IS '거래 시점 적용 환율';
COMMENT ON COLUMN public.transactions.split_ratio IS '결제자 부담 비율 (50 = 반반)';
COMMENT ON COLUMN public.transactions.split_amount IS '결제자 부담 금액 (금액 모드 입력 시)';

-- ============================================
-- 인덱스
-- ============================================

CREATE INDEX idx_transactions_couple_date ON public.transactions(couple_id, date DESC);
CREATE INDEX idx_transactions_paid_by ON public.transactions(paid_by);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_type ON public.transactions(couple_id, type);

-- ============================================
-- updated_at 자동 갱신
-- ============================================

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 커플 멤버는 커플의 모든 거래 조회 가능
CREATE POLICY "transactions_select_couple"
  ON public.transactions FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- 커플 멤버만 거래 추가 가능 (paid_by는 커플 중 누구든 가능)
CREATE POLICY "transactions_insert_couple"
  ON public.transactions FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
    AND paid_by IN (
      SELECT user1_id FROM public.couples WHERE id = couple_id
      UNION
      SELECT user2_id FROM public.couples WHERE id = couple_id
    )
  );

-- 커플 멤버는 커플의 모든 거래 수정 가능
CREATE POLICY "transactions_update_couple"
  ON public.transactions FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- 커플 멤버는 커플의 모든 거래 삭제 가능
CREATE POLICY "transactions_delete_couple"
  ON public.transactions FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
