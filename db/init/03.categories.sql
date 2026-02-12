-- PennyPair: 03. categories 테이블 + 시드 데이터
-- 실행 순서: 01.profiles.sql 이후 (ENUM 필요)

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  i18n_key VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(10) NOT NULL DEFAULT '📦',
  type transaction_type NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE public.categories IS '거래 카테고리 (i18n_key로 다국어 지원)';
COMMENT ON COLUMN public.categories.i18n_key IS 'i18n 번역 키 (예: category.food)';

-- ============================================
-- 기본 카테고리 시드 데이터 (14개)
-- ============================================

INSERT INTO public.categories (i18n_key, icon, type, sort_order) VALUES
  -- 지출 카테고리 (10개)
  ('category.food',            '🍽️', 'expense', 1),
  ('category.transport',       '🚗', 'expense', 2),
  ('category.shopping',        '🛒', 'expense', 3),
  ('category.housing',         '🏠', 'expense', 4),
  ('category.entertainment',   '🎬', 'expense', 5),
  ('category.medical',         '🏥', 'expense', 6),
  ('category.education',       '📚', 'expense', 7),
  ('category.travel',          '✈️', 'expense', 8),
  ('category.gift',            '🎁', 'expense', 9),
  ('category.other_expense',   '📦', 'expense', 10),
  -- 수입 카테고리 (4개)
  ('category.salary',          '💵', 'income', 1),
  ('category.side_income',     '💰', 'income', 2),
  ('category.investment_income','📈', 'income', 3),
  ('category.other_income',    '📦', 'income', 4);

-- ============================================
-- RLS 정책 (카테고리는 인증된 유저 모두 읽기 가능)
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_authenticated"
  ON public.categories FOR SELECT
  USING (auth.role() = 'authenticated');
