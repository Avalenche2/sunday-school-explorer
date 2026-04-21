
CREATE OR REPLACE FUNCTION public.submit_quiz(
  _quiz_id uuid,
  _answers jsonb -- array of { question_id, selected_index }
)
RETURNS jsonb -- { score, total, results: [{ question_id, selected_index, correct_index, is_correct }] }
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _score integer := 0;
  _total integer := 0;
  _attempt_id uuid;
  _results jsonb := '[]'::jsonb;
  _answer jsonb;
  _q record;
  _selected integer;
  _is_correct boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the attempt
  INSERT INTO quiz_attempts (user_id, quiz_id, score, total)
  VALUES (_uid, _quiz_id, 0, 0)
  RETURNING id INTO _attempt_id;

  FOR _answer IN SELECT * FROM jsonb_array_elements(_answers)
  LOOP
    SELECT * INTO _q FROM questions
    WHERE id = (_answer->>'question_id')::uuid AND quiz_id = _quiz_id;

    IF _q IS NULL THEN CONTINUE; END IF;

    _selected := (_answer->>'selected_index')::integer;
    _is_correct := _selected = _q.correct_index;
    _total := _total + 1;
    IF _is_correct THEN _score := _score + 1; END IF;

    INSERT INTO attempt_answers (attempt_id, question_id, selected_index, is_correct)
    VALUES (_attempt_id, _q.id, _selected, _is_correct);

    _results := _results || jsonb_build_object(
      'question_id', _q.id,
      'selected_index', _selected,
      'correct_index', _q.correct_index,
      'is_correct', _is_correct
    );
  END LOOP;

  -- Update attempt with final score
  UPDATE quiz_attempts SET score = _score, total = _total WHERE id = _attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', _attempt_id,
    'score', _score,
    'total', _total,
    'results', _results
  );
END;
$$;
