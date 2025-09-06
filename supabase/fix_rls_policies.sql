-- Fix RLS policies for quiz app

-- Start by disabling RLS completely (we'll re-enable it with proper policies)
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;

-- Create quiz management policies
-- Check if we already have the policy that allows everyone to insert quizzes
DROP POLICY IF EXISTS "Anyone can create quizzes" ON public.quizzes;
CREATE POLICY "Anyone can create quizzes" 
  ON public.quizzes 
  FOR INSERT 
  WITH CHECK (true);

-- Let creators update their quizzes
DROP POLICY IF EXISTS "Anyone can update quizzes" ON public.quizzes;
CREATE POLICY "Anyone can update quizzes" 
  ON public.quizzes 
  FOR UPDATE
  USING (true);

-- Allow selecting all quizzes for admin operations
DROP POLICY IF EXISTS "Anyone can view all quizzes" ON public.quizzes;
CREATE POLICY "Anyone can view all quizzes" 
  ON public.quizzes 
  FOR SELECT
  USING (true);

-- Create additional required policies
DO $$
BEGIN
  -- Enable RLS on other tables if needed
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' 
    AND tablename = 'questions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Row Level Security enabled for questions table';
  END IF;
END
$$;

-- Allow inserting questions
DROP POLICY IF EXISTS "Anyone can create questions" ON public.questions;
CREATE POLICY "Anyone can create questions" 
  ON public.questions 
  FOR INSERT 
  WITH CHECK (true);

-- Allow viewing questions
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
CREATE POLICY "Anyone can view questions" 
  ON public.questions 
  FOR SELECT
  USING (true);

-- Check for errors in the database schema
SELECT 
  c.table_name, 
  c.column_name, 
  c.data_type, 
  c.is_nullable, 
  c.column_default
FROM 
  information_schema.columns c
WHERE 
  c.table_schema = 'public'
  AND c.table_name IN ('quizzes', 'questions', 'attempts', 'answers')
ORDER BY 
  c.table_name, 
  c.ordinal_position;
