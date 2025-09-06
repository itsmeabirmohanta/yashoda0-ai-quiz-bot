import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Get Supabase connection details from the environment
const SUPABASE_URL = "https://ugmzhjfgrdqrpklhjbyg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbXpoamZncmRxcnBrbGhqYnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjMxNTUsImV4cCI6MjA3MjczOTE1NX0.zsZ9kIPDPnwDr2S57E8mYlygu5es57sFV0omzmhcuuc";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read SQL file
const sql = fs.readFileSync('./fix_rls_policies.sql', 'utf8');

async function runSql() {
  try {
    console.log('Connecting to Supabase...');
    
    // Execute SQL
    console.log('Executing SQL to fix RLS policies...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('SQL executed successfully!');
    console.log('Response:', data);
    
    // Test creating a quiz
    console.log('\nTesting quiz creation...');
    const testQuiz = {
      title: 'Test Quiz',
      description: 'This is a test quiz',
      shuffle_questions: false,
      shuffle_options: false,
      time_per_question_sec: 30
    };
    
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert(testQuiz)
      .select();
      
    if (quizError) {
      console.error('Error creating test quiz:', quizError);
      return;
    }
    
    console.log('Successfully created test quiz!', quizData);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the SQL
runSql();
