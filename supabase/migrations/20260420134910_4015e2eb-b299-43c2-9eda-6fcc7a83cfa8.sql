CREATE POLICY "Admins can delete attempts"
ON public.quiz_attempts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete answers"
ON public.attempt_answers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));