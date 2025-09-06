import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, Trophy } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Quiz, Question } from "@/types/quiz";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const QuizRunner = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [answers, setAnswers] = useState<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    timeTakenMs: number;
  }[]>([]);

  // Check if user has a valid attempt
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for session data
        const currentAttemptId = sessionStorage.getItem('currentAttemptId');
        const deviceToken = sessionStorage.getItem('quizDeviceToken');
        const participantName = sessionStorage.getItem('quizParticipantName');
        
        console.log("Session data check:", { 
          currentAttemptId, 
          deviceToken: deviceToken ? "exists" : "missing",
          participantName: participantName || "missing" 
        });
        
        if (!currentAttemptId) {
          // No valid attempt, redirect back to quiz gate
          console.warn("No attempt ID found in session storage");
          toast({
            title: "Session Expired",
            description: "Please enter your name to start the quiz",
            variant: "destructive",
          });
          navigate(`/q/${quizId}`);
          return;
        }
        
        // Attempt to verify the attempt in database
        console.log("Verifying attempt:", currentAttemptId);
        
        try {
          const { data, error } = await supabase
            .from('attempts')
            .select('*')
            .eq('id', currentAttemptId)
            .maybeSingle();
            
          if (error) {
            console.error("Error retrieving attempt:", error);
            // Continue anyway, we'll create a fallback below
          }
          
          if (data) {
            console.log("Retrieved attempt successfully:", data);
            setAttemptId(currentAttemptId);
            return;
          }
          
          console.warn("Attempt not found in database, will use session data");
        } catch (verifyError) {
          console.error("Failed to verify attempt:", verifyError);
        }
        
        // If we get here, we couldn't verify the attempt but have an ID
        // We'll continue with the session data
        console.log("Proceeding with session data only");
        setAttemptId(currentAttemptId);
        
      } catch (error) {
        console.error("Error in session check:", error);
        toast({
          title: "Quiz Access Error",
          description: "There was a problem accessing your quiz. Please try again.",
          variant: "destructive",
        });
        navigate(`/q/${quizId}`);
      }
    };
    
    if (quizId) {
      checkSession();
    }
  }, [quizId, navigate, toast]);

  // Fetch quiz data
  useEffect(() => {
    if (!quizId || !attemptId) return;

    const fetchQuizData = async () => {
      try {
        setLoading(true);
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .eq('is_open', true)
          .single();

        if (quizError) throw quizError;
        // Add quiz_code property to match Quiz type
        setQuiz({
          ...quizData,
          quiz_code: '' // Add the required property with an empty string default
        } as Quiz);

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_num', { ascending: true });

        if (questionsError) throw questionsError;

        // Parse options if needed and apply shuffling if enabled
        let processedQuestions = questionsData.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        }));

        // Apply shuffling if enabled in quiz settings
        if (quizData.shuffle_questions) {
          processedQuestions = [...processedQuestions].sort(() => Math.random() - 0.5);
        }

        // Shuffle options if enabled
        if (quizData.shuffle_options) {
          processedQuestions = processedQuestions.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
          }));
        }

        setQuestions(processedQuestions);
        setStartTime(Date.now());
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        toast({
          title: "Error",
          description: "Failed to load quiz. Please try again.",
          variant: "destructive",
        });
        navigate(`/q/${quizId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, attemptId, navigate, toast]);

  // Define finishQuiz with useCallback first
  const finishQuiz = useCallback(async () => {
    try {
      // Calculate total stats
      const totalCorrect = answers.filter(a => a.isCorrect).length;
      const totalTimeMs = answers.reduce((sum, a) => sum + a.timeTakenMs, 0);

      // Update attempt record
      const { error } = await supabase
        .from('attempts')
        .update({
          submitted_at: new Date().toISOString(),
          total_correct: totalCorrect,
          total_time_ms: totalTimeMs,
        })
        .eq('id', attemptId!);

      if (error) throw error;

      // Store attempt ID for leaderboard
      sessionStorage.setItem('completedAttemptId', attemptId!);
      
      // Clear current attempt
      sessionStorage.removeItem('currentAttemptId');
      
      // Navigate to leaderboard
      navigate(`/q/${quizId}/leaderboard`);
    } catch (error) {
      console.error("Error finishing quiz:", error);
      toast({
        title: "Error",
        description: "Failed to complete the quiz. Your answers were saved.",
        variant: "destructive",
      });
    }
  }, [answers, attemptId, quizId, navigate, toast]);

  // Define handleAnswer with useCallback
  const handleAnswer = useCallback(async (questionId: string, selectedOptionId: string) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) throw new Error("Question not found");

      const timeTakenMs = Date.now() - startTime;
      const isCorrect = selectedOptionId === question.answer_id;

      // Store answer locally
      setAnswers(prev => [...prev, {
        questionId,
        selectedOptionId,
        isCorrect,
        timeTakenMs
      }]);

      // Submit answer to Supabase
      const { error } = await supabase
        .from('answers')
        .insert({
          attempt_id: attemptId!,
          question_id: questionId,
          selected_option_id: selectedOptionId,
          is_correct: isCorrect,
          time_taken_ms: timeTakenMs,
        });

      if (error) throw error;

      // Move to next question or finish quiz
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setStartTime(Date.now());
      } else {
        await finishQuiz();
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [currentQuestionIndex, questions, startTime, attemptId, submitting, toast, finishQuiz]);

  // Define handleTimeExpired with useCallback
  const handleTimeExpired = useCallback(() => {
    // Auto-submit the current question with no selection
    if (currentQuestionIndex < questions.length) {
      const question = questions[currentQuestionIndex];
      handleAnswer(question.id, '');
    }
  }, [currentQuestionIndex, questions, handleAnswer]);

  // Set up timer for the current question
  useEffect(() => {
    if (!quiz || !questions.length || loading) return;

    // Clear any existing timer
    if (timer) clearInterval(timer);

    // If there's a time limit, start the timer
    if (quiz.time_per_question_sec) {
      setTimeLeft(quiz.time_per_question_sec);
      
      const interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime === null || prevTime <= 1) {
            clearInterval(interval);
            // Auto-submit on time expiry
            handleTimeExpired();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      setTimer(interval);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentQuestionIndex, quiz, questions, loading, timer, handleTimeExpired]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showAdmin={false} showLeaderboard={false} transparent={true} />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center p-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-primary border-t-2"></div>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg font-medium text-primary">Loading quiz...</p>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm md:text-base px-4 sm:px-6">Please wait while we prepare your questions</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showAdmin={false} transparent={true} />
        <div className="flex items-center justify-center h-[80vh] px-3 sm:px-4">
          <Card className="text-center p-4 sm:p-6 md:p-8 max-w-md shadow-lg border-2 w-full">
            <CardContent className="p-0">
              <div className="text-muted-foreground mb-3 sm:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 sm:mb-4 sm:w-10 sm:h-10"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">Quiz Not Available</h2>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm md:text-base">
                This quiz is either closed or doesn't exist.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 w-full text-sm sm:text-base h-auto py-1.5 sm:py-2">
                <Link to="/">Return to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar showAdmin={false} showLeaderboard={true} quizId={quizId} transparent={true} />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-2xl">
        {/* Quiz Progress */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-sm sm:text-base">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            {timeLeft !== null && (
              <div className="flex items-center text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="text-sm sm:text-base">{timeLeft}s</span>
              </div>
            )}
          </div>
          <div className="w-full bg-secondary h-2 rounded-full">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-sm border-2 overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 md:pb-4 pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <CardTitle className="text-base sm:text-lg md:text-xl break-words whitespace-normal overflow-hidden leading-normal">{currentQuestion?.text}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-5">
            <div className="space-y-2 sm:space-y-3">
              {currentQuestion?.options.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  className="w-full justify-start text-left p-2 sm:p-3 md:p-4 h-auto break-words hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  onClick={() => handleAnswer(currentQuestion.id, option.id)}
                  disabled={submitting}
                >
                  <span className="whitespace-normal overflow-visible text-xs sm:text-sm md:text-base">{option.text}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizRunner;