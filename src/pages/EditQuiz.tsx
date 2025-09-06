import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Quiz, Question, QuestionOption } from "@/types/quiz";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { v4 as uuidv4 } from 'uuid';

// Type definitions for analytics data
interface QuestionDifficultyData {
  questionId: string;
  text: string;
  correctRate: number;
}

interface QuizAnalyticsData {
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number;
  averageScore: number;
  averageTime: number;
  questionDifficulty: QuestionDifficultyData[];
}

const EditQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalyticsData | null>(null);
  const [questionForm, setQuestionForm] = useState({
    text: "",
    options: [
      { id: uuidv4(), text: "" },
      { id: uuidv4(), text: "" },
      { id: uuidv4(), text: "" },
      { id: uuidv4(), text: "" }
    ],
    answer_id: ""
  });
  
  // Format time for display (from milliseconds)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const fetchQuiz = useCallback(async () => {
    if (!id) return;
    
    try {
      console.log('Fetching quiz with ID:', id);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching quiz:', error);
        throw error;
      }
      console.log('Quiz data retrieved:', data);
      setQuiz(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch quiz:', error);
      toast({
        title: "Error",
        description: `Failed to fetch quiz: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchQuestions = useCallback(async () => {
    if (!id) return;
    
    try {
      console.log('Fetching questions for quiz ID:', id);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_num', { ascending: true });

      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }
      
      console.log('Questions data retrieved:', data);
      // Parse the JSON options properly
      if (data) {
        const parsedQuestions: Question[] = data.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        }));
        setQuestions(parsedQuestions);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch questions:', error);
      toast({
        title: "Error",
        description: `Failed to fetch questions: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [id, toast]);

  const fetchAnalytics = useCallback(async () => {
    if (!id) return;
    
    try {
      console.log('Fetching analytics for quiz ID:', id);
      
      // 1. Get attempts data
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('attempts')
        .select('id, total_correct, total_time_ms, submitted_at')
        .eq('quiz_id', id);
        
      if (attemptsError) throw attemptsError;
      
      // If no attempts, return early
      if (!attemptsData || attemptsData.length === 0) {
        setQuizAnalytics({
          totalAttempts: 0,
          completedAttempts: 0,
          completionRate: 0,
          averageScore: 0,
          averageTime: 0,
          questionDifficulty: []
        });
        return;
      }
      
      // Calculate basic metrics
      const totalAttempts = attemptsData.length;
      const completedAttempts = attemptsData.filter(a => a.submitted_at).length;
      const completionRate = Math.round((completedAttempts / totalAttempts) * 100);
      
      // Calculate averages from completed attempts
      const completedAttemptsData = attemptsData.filter(a => a.submitted_at);
      const averageScore = completedAttemptsData.reduce((sum, a) => sum + a.total_correct, 0) / completedAttempts;
      const averageTime = completedAttemptsData.reduce((sum, a) => sum + a.total_time_ms, 0) / completedAttempts;
      
      // 2. Get question difficulty data
      let questionDifficulty: QuestionDifficultyData[] = [];
      
      if (completedAttempts > 0) {
        // Get all questions for this quiz
        const { data: questionData } = await supabase
          .from('questions')
          .select('id, text')
          .eq('quiz_id', id);
          
        if (questionData && questionData.length > 0) {
          // Get all answers across all attempts
          const attemptIds = completedAttemptsData.map(a => a.id);
          
          const { data: answersData } = await supabase
            .from('answers')
            .select('question_id, is_correct')
            .in('attempt_id', attemptIds);
            
          if (answersData && answersData.length > 0) {
            // Calculate correct answer rate for each question
            questionDifficulty = questionData.map(q => {
              const questionAnswers = answersData.filter(a => a.question_id === q.id);
              const totalAnswers = questionAnswers.length;
              const correctAnswers = questionAnswers.filter(a => a.is_correct).length;
              const correctRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
              
              return {
                questionId: q.id,
                text: q.text,
                correctRate
              };
            });
            
            // Sort by difficulty (correct rate ascending)
            questionDifficulty.sort((a, b) => a.correctRate - b.correctRate);
          }
        }
      }
      
      // Set analytics state
      setQuizAnalytics({
        totalAttempts,
        completedAttempts,
        completionRate,
        averageScore,
        averageTime,
        questionDifficulty
      });
      
      console.log('Analytics data loaded:', { totalAttempts, completedAttempts });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Error",
        description: `Failed to load analytics: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) {
      fetchQuiz();
      fetchQuestions();
      fetchAnalytics();
    }
  }, [id, fetchQuiz, fetchQuestions, fetchAnalytics]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !questionForm.text.trim() || !questionForm.answer_id) {
      toast({
        title: "Error",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate options
    const validOptions = questionForm.options.filter(o => o.text.trim() !== '');
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please add at least 2 answer options",
        variant: "destructive",
      });
      return;
    }

    // Validate answer is among options
    if (!validOptions.some(o => o.id === questionForm.answer_id)) {
      toast({
        title: "Error",
        description: "Please select a valid answer option",
        variant: "destructive",
      });
      return;
    }

    setAddingQuestion(true);
    try {
      // Calculate order number as last + 1 or 1 if no questions yet
      const orderNum = questions.length ? Math.max(...questions.map(q => q.order_num)) + 1 : 1;
      
      const newQuestion = {
        quiz_id: id,
        text: questionForm.text.trim(),
        options: validOptions,
        answer_id: questionForm.answer_id,
        points: 1, // Default value
        order_num: orderNum
      };
      
      console.log('Adding new question:', newQuestion);
      
      const { data, error } = await supabase
        .from('questions')
        .insert(newQuestion)
        .select()
        .single();
        
      if (error) {
        console.error('Error adding question:', error);
        throw error;
      }
      
      console.log('Question added:', data);
      
      // Refresh questions list
      fetchQuestions();
      
      // Reset form and close modal
      setQuestionForm({
        text: "",
        options: [
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" }
        ],
        answer_id: ""
      });
      
      setIsAddQuestionModalOpen(false);
      
      // Refresh analytics data if there are attempts
      if (quizAnalytics && quizAnalytics.totalAttempts > 0) {
        fetchAnalytics();
      }
      
      toast({
        title: "Success",
        description: "Question added successfully",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to add question:', error);
      toast({
        title: "Error",
        description: `Failed to add question: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...questionForm.options];
    updatedOptions[index] = { ...updatedOptions[index], text: value };
    setQuestionForm({ ...questionForm, options: updatedOptions });
  };
  
  const handleAnswerChange = (optionId: string) => {
    setQuestionForm({ ...questionForm, answer_id: optionId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-2xl font-bold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The quiz you're looking for doesn't exist or has been deleted.
            </p>
            <Button asChild>
              <Link to="/admin">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SQ</span>
              </div>
              <h1 className="text-xl font-bold text-primary">SwiftQuiz</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{quiz.title}</h2>
          <p className="text-muted-foreground">
            {quiz.description || "No description provided"}
          </p>
        </div>

        {/* Quiz Management Cards */}
        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Add and manage questions for this quiz
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddQuestionModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first question to get started.
                  </p>
                  <Button onClick={() => setIsAddQuestionModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="bg-muted/40">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                                Q{index + 1}
                              </span>
                              <h3 className="font-semibold">{question.text}</h3>
                            </div>
                            <div className="pl-8 space-y-1">
                              {question.options.map((option) => (
                                <div 
                                  key={option.id} 
                                  className={`text-sm p-1 rounded ${
                                    option.id === question.answer_id ? 'bg-green-100 text-green-800' : ''
                                  }`}
                                >
                                  {option.text} 
                                  {option.id === question.answer_id && (
                                    <span className="text-xs ml-2 text-green-600 font-semibold">(Correct)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete this question? This cannot be undone.`)) {
                                try {
                                  const { error } = await supabase
                                    .from('questions')
                                    .delete()
                                    .eq('id', question.id);
                                    
                                  if (error) throw error;
                                  
                                  // Remove question from local state
                                  setQuestions(questions.filter(q => q.id !== question.id));
                                  
                                  // Refresh analytics data if there are attempts
                                  if (quizAnalytics && quizAnalytics.totalAttempts > 0) {
                                    fetchAnalytics();
                                  }
                                  
                                  toast({
                                    title: "Question Deleted",
                                    description: "The question has been deleted successfully",
                                  });
                                } catch (error: unknown) {
                                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                  console.error('Failed to delete question:', error);
                                  toast({
                                    title: "Error",
                                    description: `Failed to delete question: ${errorMessage}`,
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>
                Configure quiz availability and sharing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <h4 className="font-semibold">Quiz Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {quiz.is_open ? "Quiz is currently open for participants" : "Quiz is closed"}
                    </p>
                  </div>
                  <Button 
                    variant={quiz.is_open ? "destructive" : "default"}
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('quizzes')
                          .update({ is_open: !quiz.is_open })
                          .eq('id', quiz.id);
                        
                        if (error) throw error;
                        
                        setQuiz({ ...quiz, is_open: !quiz.is_open });
                        
                        toast({
                          title: `Quiz ${quiz.is_open ? 'Closed' : 'Opened'}`,
                          description: `The quiz has been ${quiz.is_open ? 'closed' : 'opened'} successfully.`,
                        });
                      } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('Failed to update quiz status:', error);
                        toast({
                          title: "Error",
                          description: `Failed to update quiz status: ${errorMessage}`,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    {quiz.is_open ? "Close Quiz" : "Open Quiz"}
                  </Button>
                </div>

                {quiz.is_open && (
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Share Link</h4>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={`${window.location.origin}/q/${quiz.id}`}
                        className="flex-1 px-3 py-2 bg-background border rounded-md text-sm"
                      />
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const shareLink = `${window.location.origin}/q/${quiz.id}`;
                          navigator.clipboard.writeText(shareLink)
                            .then(() => {
                              toast({
                                title: "Link Copied",
                                description: "Quiz link copied to clipboard",
                              });
                            })
                            .catch(() => {
                              toast({
                                title: "Failed to Copy",
                                description: "Could not copy to clipboard",
                                variant: "destructive",
                              });
                            });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Analytics</CardTitle>
              <CardDescription>
                View participation and performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                  <p className="mt-2 text-muted-foreground">Loading analytics...</p>
                </div>
              ) : !quizAnalytics || quizAnalytics.totalAttempts === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Analytics will appear once participants start taking the quiz.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to={`/leaderboard/${quiz?.id}`}>View Leaderboard</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-muted/40 p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Total Attempts</div>
                      <div className="text-2xl font-bold">{quizAnalytics.totalAttempts}</div>
                    </div>
                    <div className="bg-muted/40 p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Avg. Score</div>
                      <div className="text-2xl font-bold">{quizAnalytics.averageScore.toFixed(1)}</div>
                    </div>
                    <div className="bg-muted/40 p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
                      <div className="text-2xl font-bold">{quizAnalytics.completionRate}%</div>
                    </div>
                    <div className="bg-muted/40 p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Avg. Time</div>
                      <div className="text-2xl font-bold">{formatTime(quizAnalytics.averageTime)}</div>
                    </div>
                  </div>
                  
                  {/* Question difficulty */}
                  {quizAnalytics.questionDifficulty.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Question Difficulty</h3>
                      <div className="space-y-2">
                        {quizAnalytics.questionDifficulty.map((q, i) => (
                          <div key={q.questionId} className="bg-card rounded-md p-3 border">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-sm font-medium flex items-center">
                                <span className="bg-primary/20 text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">
                                  {i+1}
                                </span>
                                <span className="line-clamp-1">{q.text}</span>
                              </div>
                              <div>
                                <Badge 
                                  variant={q.correctRate >= 70 ? "outline" : q.correctRate >= 40 ? "secondary" : "destructive"}
                                  className="text-xs"
                                >
                                  {q.correctRate >= 70 ? "Easy" : q.correctRate >= 40 ? "Medium" : "Hard"} 
                                  ({q.correctRate}%)
                                </Badge>
                              </div>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full" 
                                style={{ width: `${q.correctRate}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* View more button */}
                  <div className="flex justify-center mt-4">
                    <Button asChild>
                      <Link to={`/leaderboard/${quiz?.id}`}>
                        View Complete Leaderboard
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Question Modal */}
      <Dialog open={isAddQuestionModalOpen} onOpenChange={setIsAddQuestionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new question for your quiz. Enter the question text and define answer options.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddQuestion}>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="question-text">Question Text *</Label>
                <Textarea
                  id="question-text"
                  placeholder="Enter your question..."
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Answer Options *</Label>
                <RadioGroup value={questionForm.answer_id} onValueChange={handleAnswerChange}>
                  {questionForm.options.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={`option-${index}`} />
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-sm text-muted-foreground">Select the correct answer.</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddQuestionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingQuestion}>
                {addingQuestion ? (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : null}
                Add Question
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditQuiz;
