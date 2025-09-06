import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Clock, Users, Trophy } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Quiz } from "@/types/quiz";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const QuizGate = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [name, setName] = useState("");

  const fetchQuiz = useCallback(async () => {
    try {
      console.log("Fetching quiz with ID:", quizId);
      
      let data;
      let error;
      
      // Check if the quizId looks like a UUID or a short code
      if (quizId && quizId.length === 6 && !/[^A-Z0-9]/i.test(quizId)) {
        // It's likely a quiz code - fetch by quiz_code
        const result = await supabase
          .from('quizzes')
          .select('*')
          .eq('is_open', true)
          .eq('quiz_code', quizId.toUpperCase())
          .single();
          
        data = result.data;
        error = result.error;
      } else {
        // It's likely a UUID - fetch by id
        const result = await supabase
          .from('quizzes')
          .select('*')
          .eq('is_open', true)
          .eq('id', quizId)
          .single();
          
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error fetching quiz:", error);
        throw error;
      }
      
      console.log("Quiz data retrieved:", data);
      // Add required properties to match Quiz type
      setQuiz({
        ...data,
        quiz_code: '' // Add required field with default value
      } as Quiz);
    } catch (error) {
      console.error("Failed to fetch quiz:", error);
      toast({
        title: "Quiz Not Available",
        description: "This quiz is either closed or doesn't exist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [quizId, toast]);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, fetchQuiz]);

  const startQuiz = async () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to continue",
        variant: "destructive",
      });
      return;
    }

    setStarting(true);
    try {
      console.log("Starting quiz for:", name.trim());
      
      // Generate a device token
      const deviceToken = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      // First, try to create the attempt
      console.log("Creating attempt for quiz:", quizId);
      
      // Create the attempt
      let attemptResult;
      try {
        const { data, error } = await supabase
          .from('attempts')
          .insert({
            quiz_id: quizId!,
            name: name.trim(),
            device_token: deviceToken,
          })
          .select()
          .single();
        
        if (error) {
          console.error("First attempt creation error:", error);
          throw error;
        }
        
        attemptResult = data;
      } catch (initialError) {
        console.warn("Initial attempt failed, trying anonymous insert:", initialError);
        
        // Fall back to anonymous access
        const anonClient = supabase.auth.getSession();
        console.log("Anonymous client:", anonClient);
        
        // Try one more time
        const { data, error } = await supabase
          .from('attempts')
          .insert({
            quiz_id: quizId!,
            name: name.trim(),
            device_token: deviceToken,
          })
          .select()
          .single();
          
        if (error) {
          console.error("Final attempt creation error:", error);
          throw error;
        }
        
        attemptResult = data;
      }
      
      if (!attemptResult || !attemptResult.id) {
        throw new Error("Failed to create attempt: No data returned");
      }
      
      console.log("Attempt created successfully:", attemptResult);
      
      // Store all information in session storage for backup
      sessionStorage.setItem('quizDeviceToken', deviceToken);
      sessionStorage.setItem('currentAttemptId', attemptResult.id);
      sessionStorage.setItem('quizParticipantName', name.trim());
      
      // Additional debug info storage
      const debugInfo = {
        quizId,
        attemptId: attemptResult.id,
        name: name.trim(),
        deviceToken,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem('quizDebugInfo', JSON.stringify(debugInfo));
      
      // Navigate to quiz
      console.log("Navigating to quiz runner");
      navigate(`/q/${quizId}/quiz`);
    } catch (error) {
      console.error("Failed to start quiz:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error Starting Quiz",
        description: `Please try again. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showAdmin={false} />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center p-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-2"></div>
            <p className="mt-4 text-lg font-medium text-primary">Loading quiz...</p>
            <p className="text-muted-foreground mt-2">Please wait while we set things up</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showAdmin={false} />
        <div className="flex items-center justify-center h-[80vh]">
          <Card className="text-center p-8 max-w-md shadow-lg border-2">
            <CardContent>
              <div className="text-muted-foreground mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h2 className="text-2xl font-bold mb-3">Quiz Not Available</h2>
              <p className="text-muted-foreground mb-6">
                This quiz is either closed, doesn't exist, or has ended.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/">Return to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar showAdmin={false} showLeaderboard={true} quizId={quizId} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-primary-foreground font-bold text-xl">SQ</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground text-lg">{quiz.description}</p>
          )}
        </div>

        {/* Quiz Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 shadow-sm hover:shadow transition-shadow">
            <CardContent className="flex items-center p-4">
              <Clock className="w-8 h-8 text-primary mr-3" />
              <div>
                <h3 className="font-semibold">Time Limit</h3>
                <p className="text-sm text-muted-foreground">
                  {quiz.time_per_question_sec 
                    ? `${quiz.time_per_question_sec} seconds per question`
                    : "No time limit"
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm hover:shadow transition-shadow">
            <CardContent className="flex items-center p-4">
              <Users className="w-8 h-8 text-primary mr-3" />
              <div>
                <h3 className="font-semibold">Format</h3>
                <p className="text-sm text-muted-foreground">
                  Multiple choice questions
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 shadow-sm hover:shadow transition-shadow">
            <CardContent className="flex items-center p-4">
              <Trophy className="w-8 h-8 text-primary mr-3" />
              <div>
                <h3 className="font-semibold">Leaderboard</h3>
                <p className="text-sm text-muted-foreground">
                  See top performers
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Quiz Form */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
            <CardTitle>Ready to Start?</CardTitle>
            <CardDescription>
              Enter your name to begin the quiz. You'll see questions one at a time.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && startQuiz()}
                  maxLength={50}
                  className="p-6 text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  This will be shown on the leaderboard
                </p>
              </div>

              <Button 
                onClick={startQuiz} 
                disabled={starting || !name.trim()} 
                className="w-full bg-primary hover:bg-primary/90 p-6 text-lg h-auto"
              >
                {starting ? (
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                ) : (
                  <ArrowRight className="w-5 h-5 mr-3" />
                )}
                Start Quiz
              </Button>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Questions cannot be changed once answered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizGate;