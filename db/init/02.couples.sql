-- PennyPair: 02. couples 테이블
-- 실행 순서: 01.profiles.sql 이후

CREATE TABLE public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT couple_unique UNIQUE (user1_id, user2_id),
  CONSTRAINT couple_different_users CHECK (user1_id <> user2_id)
);

COMMENT ON TABLE public.couples IS '커플 연결 테이블';

CREATE INDEX idx_couples_user1 ON public.couples(user1_id);
CREATE INDEX idx_couples_user2 ON public.couples(user2_id);

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couples_select_own"
  ON public.couples FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================
-- profiles 파트너 조회 정책 (couples 테이블 생성 후 추가)
-- ============================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_own_and_partner"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
      FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
