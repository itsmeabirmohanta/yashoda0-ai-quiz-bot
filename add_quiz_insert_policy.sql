-- Add a policy that allows inserting into quizzes table
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/{your-project-id}/sql/new)

-- Check if the policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'quizzes' AND policyname = 'Anyone can create quizzes'
    ) THEN
        -- Create the policy if it doesn't exist
        EXECUTE 'CREATE POLICY "Anyone can create quizzes" ON public.quizzes FOR INSERT WITH CHECK (true)';
        RAISE NOTICE 'Created policy: Anyone can create quizzes';
    ELSE
        RAISE NOTICE 'Policy already exists: Anyone can create quizzes';
    END IF;
END
$$;
