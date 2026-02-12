-- PennyPair: 06. exchange_rate_cache 테이블
-- 실행 순서: 01.profiles.sql 이후 (ENUM 필요)

CREATE TABLE public.exchange_rate_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency currency_code NOT NULL,
  target_currency currency_code NOT NULL,
  rate NUMERIC(18, 8) NOT NULL,
  rate_date DATE NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT exchange_rate_unique UNIQUE (base_currency, target_currency, rate_date),
  CONSTRAINT exchange_rate_different CHECK (base_currency <> target_currency)
);

COMMENT ON TABLE public.exchange_rate_cache IS '환율 캐시 (Frankfurter API 일별 캐싱)';
COMMENT ON COLUMN public.exchange_rate_cache.rate IS '기준 통화 1단위 = 대상 통화 rate단위';
COMMENT ON COLUMN public.exchange_rate_cache.rate_date IS '환율 기준일';

-- ============================================
-- 인덱스
-- ============================================

CREATE INDEX idx_exchange_rate_date ON public.exchange_rate_cache(rate_date DESC);
CREATE INDEX idx_exchange_rate_pair ON public.exchange_rate_cache(base_currency, target_currency, rate_date DESC);

-- ============================================
-- RLS 정책 (인증된 유저 모두 읽기/쓰기 가능)
-- ============================================

ALTER TABLE public.exchange_rate_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rate_select_authenticated"
  ON public.exchange_rate_cache FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "exchange_rate_insert_authenticated"
  ON public.exchange_rate_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
