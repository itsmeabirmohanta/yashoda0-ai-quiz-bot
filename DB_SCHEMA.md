# Database Schema Documentation

This document provides details about the QuizApp database schema.

## Tables

### quizzes

Stores information about each quiz created in the system.

| Column                | Type                     | Constraints                   | Description                                      |
|-----------------------|--------------------------|-------------------------------|--------------------------------------------------|
| id                    | UUID                     | PK, NOT NULL, DEFAULT         | Unique identifier for each quiz                  |
| title                 | TEXT                     | NOT NULL                      | Title of the quiz                                |
| description           | TEXT                     |                               | Optional description of the quiz                 |
| is_open               | BOOLEAN                  | NOT NULL, DEFAULT false       | Whether the quiz is open for attempts            |
| scoring_strategy      | TEXT                     | NOT NULL, DEFAULT             | Strategy for scoring (most_correct_then_fastest) |
| shuffle_questions     | BOOLEAN                  | NOT NULL, DEFAULT false       | Whether to shuffle questions order               |
| shuffle_options       | BOOLEAN                  | NOT NULL, DEFAULT false       | Whether to shuffle answer options                |
| time_per_question_sec | INTEGER                  |                               | Time limit per question in seconds               |
| quiz_code             | VARCHAR(8)               | UNIQUE, NOT NULL              | Unique code for accessing the quiz               |
| created_at            | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now()       | Timestamp of quiz creation                       |
| updated_at            | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now()       | Timestamp of last update                         |

### questions

Stores the questions for each quiz.

| Column      | Type                     | Constraints                  | Description                                        |
|-------------|--------------------------|------------------------------|----------------------------------------------------|
| id          | UUID                     | PK, NOT NULL, DEFAULT        | Unique identifier for each question                |
| quiz_id     | UUID                     | FK REFERENCES quizzes(id)    | Quiz this question belongs to                      |
| text        | TEXT                     | NOT NULL                     | The question text                                  |
| options     | JSONB                    | NOT NULL                     | Array of option objects: [{id: string, text: string}] |
| answer_id   | TEXT                     | NOT NULL                     | ID of the correct option                          |
| points      | INTEGER                  | NOT NULL, DEFAULT 1          | Points awarded for correct answer                  |
| order_num   | INTEGER                  | NOT NULL                     | Ordering position of the question                  |
| created_at  | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now()      | Timestamp of question creation                     |

### attempts

Records each attempt made by participants.

| Column        | Type                     | Constraints                 | Description                                     |
|---------------|--------------------------|-----------------------------|-------------------------------------------------|
| id            | UUID                     | PK, NOT NULL, DEFAULT       | Unique identifier for each attempt              |
| quiz_id       | UUID                     | FK REFERENCES quizzes(id)   | Quiz being attempted                            |
| name          | TEXT                     | NOT NULL                    | Name of the participant                         |
| started_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now()     | When the attempt started                        |
| submitted_at  | TIMESTAMP WITH TIME ZONE |                             | When the attempt was submitted (NULL if ongoing)|
| total_correct | INTEGER                  | DEFAULT 0                   | Total number of correct answers                 |
| total_time_ms | BIGINT                   | DEFAULT 0                   | Total time taken in milliseconds                |
| device_token  | TEXT                     | NOT NULL                    | Token identifying the device                    |
| created_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now()     | Timestamp of attempt creation                   |

### answers

Stores individual answers for each question in an attempt.

| Column             | Type                     | Constraints                    | Description                                    |
|--------------------|--------------------------|--------------------------------|------------------------------------------------|
| id                 | UUID                     | PK, NOT NULL, DEFAULT          | Unique identifier for each answer              |
| attempt_id         | UUID                     | FK REFERENCES attempts(id)     | The attempt this answer belongs to             |
| question_id        | UUID                     | FK REFERENCES questions(id)    | The question being answered                    |
| selected_option_id | TEXT                     | NOT NULL                       | ID of the selected option                      |
| is_correct         | BOOLEAN                  | NOT NULL, DEFAULT false        | Whether the answer is correct                  |
| time_taken_ms      | INTEGER                  | NOT NULL                       | Time taken to answer in milliseconds           |
| answered_at        | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now()        | Timestamp when the question was answered       |

## Row Level Security Policies

### quizzes

- Public can read open quizzes
- Anyone can create quizzes

### questions

- Public can read questions of open quizzes

### attempts

- Anyone can create attempts for open quizzes
- Public can read submitted attempts

### answers

- Users can create answers for their attempts
- Public can read answers of submitted attempts

## Indexes

- `idx_questions_quiz_id` on `questions(quiz_id)`
- `idx_questions_order` on `questions(quiz_id, order_num)`
- `idx_attempts_quiz_id` on `attempts(quiz_id)`
- `idx_attempts_leaderboard` on `attempts(quiz_id, total_correct DESC, total_time_ms ASC)`
- `idx_answers_attempt_id` on `answers(attempt_id)`

## Functions and Triggers

### update_updated_at_column()

Updates the `updated_at` column to the current timestamp whenever a record is updated.

### generate_quiz_code()

Generates a unique 6-character alphanumeric code for new quizzes when the `quiz_code` field is NULL.

### Triggers

- `update_quizzes_updated_at`: Updates timestamp on quiz modifications
- `set_quiz_code_on_insert`: Automatically generates quiz codes on insertion
