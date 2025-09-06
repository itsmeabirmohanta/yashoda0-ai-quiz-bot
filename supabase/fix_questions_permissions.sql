-- Add missing permissions for questions management

-- Allow users to update questions
DROP POLICY IF EXISTS "Anyone can update questions" ON public.questions;
CREATE POLICY "Anyone can update questions" 
  ON public.questions 
  FOR UPDATE
  USING (true);

-- Allow users to view all questions (needed for editing quizzes)
DROP POLICY IF EXISTS "Anyone can view all questions" ON public.questions;
CREATE POLICY "Anyone can view all questions" 
  ON public.questions 
  FOR SELECT
  USING (true);
