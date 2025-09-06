-- Fix permissions for answers table

-- Enable Row Level Security for answers table
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own answers
DROP POLICY IF EXISTS "Users can read their own answers" ON public.answers;
CREATE POLICY "Users can read their own answers" 
  ON public.answers 
  FOR SELECT 
  USING (true);

-- Create policy for users to insert answers
DROP POLICY IF EXISTS "Anyone can create answers" ON public.answers;
CREATE POLICY "Anyone can create answers"
  ON public.answers
  FOR INSERT
  WITH CHECK (true);
