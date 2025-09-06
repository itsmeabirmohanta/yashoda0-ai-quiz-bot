-- Fix for quiz deletion permissions issue
-- Run this SQL in your Supabase SQL Editor

-- Add policy to allow authenticated users to delete quizzes
DROP POLICY IF EXISTS "Anyone can delete quizzes" ON public.quizzes;
CREATE POLICY "Anyone can delete quizzes" 
  ON public.quizzes 
  FOR DELETE
  USING (true);

-- Verify that cascade delete is properly set up
DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) 
    JOIN information_schema.referential_constraints AS rc USING (constraint_schema, constraint_name)
    JOIN information_schema.table_constraints AS ref ON rc.unique_constraint_schema = ref.constraint_schema 
                                                   AND rc.unique_constraint_name = ref.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'questions'
    AND ccu.column_name = 'quiz_id'
    AND rc.delete_rule = 'CASCADE'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE 'CASCADE DELETE constraint is properly set up for questions.quiz_id';
  ELSE
    RAISE NOTICE 'WARNING: CASCADE DELETE constraint is not properly set up for questions.quiz_id';
  END IF;
END $$;

-- Verify that RLS is properly enabled and not blocking deletions
SELECT 
  tablename, 
  rowsecurity
FROM 
  pg_tables
WHERE 
  schemaname = 'public' 
  AND tablename IN ('quizzes', 'questions', 'attempts', 'answers');

-- Check if the delete policy is now in place
SELECT
  pol.polname AS policy_name,
  tab.tablename AS table_name,
  CASE
    WHEN pol.polpermissive THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END AS permissive,
  pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS using_expression
FROM
  pg_catalog.pg_policy pol
  JOIN pg_catalog.pg_class cls ON pol.polrelid = cls.oid
  JOIN pg_catalog.pg_namespace nsp ON cls.relnamespace = nsp.oid
  JOIN pg_tables tab ON cls.relname = tab.tablename AND nsp.nspname = tab.schemaname
WHERE
  nsp.nspname = 'public'
  AND cls.relname = 'quizzes'
  AND pol.polcmd = 'DELETE';
