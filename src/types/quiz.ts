export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  scoring_strategy: string;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  time_per_question_sec: number | null;
  quiz_code: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  text: string;
  options: QuestionOption[];
  answer_id: string;
  points: number;
  order_num: number;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Attempt {
  id: string;
  quiz_id: string;
  name: string;
  started_at: string;
  submitted_at: string | null;
  total_correct: number;
  total_time_ms: number;
  device_token: string;
  created_at: string;
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  time_taken_ms: number;
  answered_at: string;
}