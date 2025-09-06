-- Add quiz_code field to quizzes table
ALTER TABLE public.quizzes ADD COLUMN quiz_code VARCHAR(8) UNIQUE;

-- Populate existing quizzes with random codes
UPDATE public.quizzes SET quiz_code = 
    SUBSTRING(UPPER(encode(gen_random_bytes(8), 'hex')), 1, 6)
WHERE quiz_code IS NULL;

-- Make quiz_code NOT NULL
ALTER TABLE public.quizzes ALTER COLUMN quiz_code SET NOT NULL;

-- Create function to generate random code on quiz creation
CREATE OR REPLACE FUNCTION generate_quiz_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(8);
    code_exists INTEGER;
BEGIN
    LOOP
        -- Generate a 6-character random alphanumeric code
        new_code := SUBSTRING(UPPER(encode(gen_random_bytes(8), 'hex')), 1, 6);
        
        -- Check if code already exists
        SELECT COUNT(*) INTO code_exists FROM public.quizzes WHERE quiz_code = new_code;
        
        -- Exit loop if unique code found
        IF code_exists = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Assign new code to the record
    NEW.quiz_code := new_code;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate quiz code on insert
CREATE TRIGGER set_quiz_code_on_insert
BEFORE INSERT ON public.quizzes
FOR EACH ROW
WHEN (NEW.quiz_code IS NULL)
EXECUTE FUNCTION generate_quiz_code();
