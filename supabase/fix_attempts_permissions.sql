-- Fix permissions for attempts table

-- Enable Row Level Security for attempts table
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own attempts
DROP POLICY IF EXISTS "Users can read their own attempts" ON public.attempts;
CREATE POLICY "Users can read their own attempts" 
  ON public.attempts 
  FOR SELECT 
  USING (true);

-- Create policy for users to update their own attempts (for submitting answers)
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.attempts;
CREATE POLICY "Users can update their own attempts" 
  ON public.attempts 
  FOR UPDATE
  USING (true);

-- Create policy for users to insert attempts (for starting quizzes)
DROP POLICY IF EXISTS "Anyone can create attempts" ON public.attempts;
CREATE POLICY "Anyone can create attempts"
  ON public.attempts
  FOR INSERT
  WITH CHECK (true);
