-- PennyPair: 01. ENUM 타입 + profiles 테이블
-- 실행 순서: 가장 먼저 실행

-- ============================================
-- ENUM 타입 생성
-- ============================================

CREATE TYPE currency_code AS ENUM ('KRW', 'JPY', 'USD');
CREATE TYPE language_code AS ENUM ('ko', 'ja', 'en');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE split_type AS ENUM ('50_50', 'custom', 'paid_for_self', 'paid_for_partner');

-- ============================================
-- profiles 테이블 (auth.users 확장)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  home_currency currency_code NOT NULL DEFAULT 'KRW',
  preferred_language language_code NOT NULL DEFAULT 'en',
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS '유저 프로필 (auth.users 확장)';
COMMENT ON COLUMN public.profiles.home_currency IS '기본 통화 (KRW/JPY/USD)';
COMMENT ON COLUMN public.profiles.preferred_language IS 'UI 언어 설정 (ko/ja/en)';

-- ============================================
-- auth.users 생성 시 profiles 자동 생성 트리거
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필만 조회 (파트너 조회는 02.couples.sql에서 추가)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());
