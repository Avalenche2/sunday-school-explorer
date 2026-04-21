
CREATE OR REPLACE FUNCTION public.submit_daily_challenge(
  _challenge_id uuid,
  _selected_index integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _correct integer;
  _date date;
  _is_correct boolean;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if already attempted
  IF EXISTS (
    SELECT 1 FROM daily_challenge_attempts
    WHERE user_id = _uid AND challenge_id = _challenge_id
  ) THEN
    RAISE EXCEPTION 'Already attempted';
  END IF;

  -- Get correct answer (bypasses RLS via SECURITY DEFINER)
  SELECT correct_index, challenge_date INTO _correct, _date
  FROM daily_challenges WHERE id = _challenge_id;

  IF _correct IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  _is_correct := (_selected_index = _correct);

  INSERT INTO daily_challenge_attempts (user_id, challenge_id, challenge_date, selected_index, is_correct)
  VALUES (_uid, _challenge_id, _date, _selected_index, _is_correct);

  RETURN _is_correct;
END;
$$;
