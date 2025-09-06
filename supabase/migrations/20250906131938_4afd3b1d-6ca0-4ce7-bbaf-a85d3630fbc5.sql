-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_open BOOLEAN NOT NULL DEFAULT false,
  scoring_strategy TEXT NOT NULL DEFAULT 'most_correct_then_fastest',
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  shuffle_options BOOLEAN NOT NULL DEFAULT false,
  time_per_question_sec INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id: string, text: string}]
  answer_id TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attempts table
CREATE TABLE public.attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  total_correct INTEGER DEFAULT 0,
  total_time_ms BIGINT DEFAULT 0,
  device_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken_ms INTEGER NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Public can read open quizzes" ON public.quizzes
  FOR SELECT USING (is_open = true);

-- Allow inserting new quizzes (typically done by administrators)
CREATE POLICY "Anyone can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (true);

-- RLS Policies for questions  
CREATE POLICY "Public can read questions of open quizzes" ON public.questions
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE is_open = true)
  );

-- RLS Policies for attempts
CREATE POLICY "Anyone can create attempts for open quizzes" ON public.attempts
  FOR INSERT WITH CHECK (
    quiz_id IN (SELECT id FROM public.quizzes WHERE is_open = true)
  );

CREATE POLICY "Public can read submitted attempts" ON public.attempts
  FOR SELECT USING (submitted_at IS NOT NULL);

-- RLS Policies for answers
CREATE POLICY "Users can create answers for their attempts" ON public.answers
  FOR INSERT WITH CHECK (
    attempt_id IN (SELECT id FROM public.attempts)
  );

CREATE POLICY "Public can read answers of submitted attempts" ON public.answers
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM public.attempts WHERE submitted_at IS NOT NULL)
  );

-- Create indexes for performance
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_questions_order ON public.questions(quiz_id, order_num);
CREATE INDEX idx_attempts_quiz_id ON public.attempts(quiz_id);
CREATE INDEX idx_attempts_leaderboard ON public.attempts(quiz_id, total_correct DESC, total_time_ms ASC);
CREATE INDEX idx_answers_attempt_id ON public.answers(attempt_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();