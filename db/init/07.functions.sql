-- PennyPair: 07. 헬퍼 함수
-- 실행 순서: 02.couples.sql 이후

-- ============================================
-- get_couple_id: 유저 ID로 커플 ID 조회
-- ============================================

CREATE OR REPLACE FUNCTION public.get_couple_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT id
  FROM public.couples
  WHERE user1_id = p_user_id OR user2_id = p_user_id
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_couple_id IS '유저 ID로 소속 커플 ID 조회';

-- ============================================
-- get_partner_id: 유저 ID로 파트너 ID 조회
-- ============================================

CREATE OR REPLACE FUNCTION public.get_partner_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT CASE
    WHEN user1_id = p_user_id THEN user2_id
    ELSE user1_id
  END
  FROM public.couples
  WHERE user1_id = p_user_id OR user2_id = p_user_id
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_partner_id IS '유저 ID로 파트너 ID 조회';

-- ============================================
-- get_couple_balance: 커플 간 미정산 잔액 계산
-- 양수: user1이 user2에게 줘야 할 금액
-- 음수: user2가 user1에게 줘야 할 금액
-- ============================================

CREATE OR REPLACE FUNCTION public.get_couple_balance(
  p_couple_id UUID,
  p_display_currency currency_code DEFAULT 'KRW'
)
RETURNS NUMERIC AS $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_balance NUMERIC := 0;
  v_tx RECORD;
  v_amount_in_display NUMERIC;
  v_user1_share NUMERIC;
  v_user2_share NUMERIC;
BEGIN
  -- 커플 구성원 조회
  SELECT user1_id, user2_id INTO v_user1_id, v_user2_id
  FROM public.couples WHERE id = p_couple_id;

  -- 마지막 정산 이후 거래만 계산
  FOR v_tx IN
    SELECT t.*
    FROM public.transactions t
    WHERE t.couple_id = p_couple_id
      AND t.type = 'expense'
      AND t.date > COALESCE(
        (SELECT MAX(period_end) FROM public.settlements WHERE couple_id = p_couple_id),
        '1900-01-01'::DATE
      )
  LOOP
    -- 표시 통화로 금액 결정
    IF v_tx.currency = p_display_currency THEN
      v_amount_in_display := v_tx.amount;
    ELSIF v_tx.converted_currency = p_display_currency THEN
      v_amount_in_display := v_tx.converted_amount;
    ELSE
      v_amount_in_display := v_tx.amount; -- 폴백
    END IF;

    -- split_type에 따라 각자 부담분 계산
    CASE v_tx.split_type
      WHEN '50_50' THEN
        v_user1_share := v_amount_in_display * 0.5;
        v_user2_share := v_amount_in_display * 0.5;
      WHEN 'custom' THEN
        IF v_tx.paid_by = v_user1_id THEN
          v_user1_share := v_amount_in_display * (v_tx.split_ratio / 100);
          v_user2_share := v_amount_in_display * (1 - v_tx.split_ratio / 100);
        ELSE
          v_user2_share := v_amount_in_display * (v_tx.split_ratio / 100);
          v_user1_share := v_amount_in_display * (1 - v_tx.split_ratio / 100);
        END IF;
      WHEN 'paid_for_self' THEN
        IF v_tx.paid_by = v_user1_id THEN
          v_user1_share := v_amount_in_display;
          v_user2_share := 0;
        ELSE
          v_user1_share := 0;
          v_user2_share := v_amount_in_display;
        END IF;
      WHEN 'paid_for_partner' THEN
        IF v_tx.paid_by = v_user1_id THEN
          v_user1_share := 0;
          v_user2_share := v_amount_in_display;
        ELSE
          v_user1_share := v_amount_in_display;
          v_user2_share := 0;
        END IF;
    END CASE;

    -- 결제자 기준으로 잔액 조정
    -- user1이 결제: user2가 본인 부담분만큼 user1에게 빚짐 (balance 감소)
    -- user2가 결제: user1이 본인 부담분만큼 user2에게 빚짐 (balance 증가)
    IF v_tx.paid_by = v_user1_id THEN
      v_balance := v_balance - v_user2_share;
    ELSE
      v_balance := v_balance + v_user1_share;
    END IF;
  END LOOP;

  RETURN ROUND(v_balance, 2);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_couple_balance IS '커플 간 미정산 잔액 (양수: user1→user2, 음수: user2→user1)';
