import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Settings, 
  Users, 
  Calendar, 
  LogOut, 
  Layers, 
  PieChart, 
  CheckSquare, 
  Clock, 
  Share2, 
  Copy, 
  ClipboardCopy,
  SearchIcon,
  Filter,
  Trophy,
  Trash2,
  BarChart3,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Star,
  Rocket
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Quiz } from "@/types/quiz";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Apply filters when quizzes, search query or status filter changes
    filterQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizzes, searchQuery, statusFilter]);

  const fetchQuizzes = async () => {
    try {
      console.log('Fetching all quizzes');
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quizzes:', error);
        throw error;
      }
      
      console.log('Quizzes retrieved:', data?.length || 0);
      setQuizzes(data || []);
      setFilteredQuizzes(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch quizzes:', error);
      toast({
        title: "Error",
        description: `Failed to fetch quizzes: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterQuizzes = () => {
    let result = [...quizzes];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(quiz => 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (statusFilter === "active") {
      result = result.filter(quiz => quiz.is_open);
    } else if (statusFilter === "closed") {
      result = result.filter(quiz => !quiz.is_open);
    }
    
    setFilteredQuizzes(result);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const copyQuizLink = (quizId: string) => {
    // Create a link that will work both in development and production
    const path = `/q/${quizId}`;
    const absoluteUrl = new URL(path, window.location.origin).toString();
    navigator.clipboard.writeText(absoluteUrl);
    toast({
      title: "Link Copied",
      description: "Quiz link copied to clipboard",
    });
  };
  
  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    try {
      setLoading(true);
      
      // First delete related questions (cascade should handle options)
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizToDelete.id);
      
      if (questionsError) {
        console.error('Error deleting questions:', questionsError);
        throw questionsError;
      }
      
      // Then delete attempts and their answers (assuming cascade is set up)
      const { error: attemptsError } = await supabase
        .from('attempts')
        .delete()
        .eq('quiz_id', quizToDelete.id);
      
      if (attemptsError) {
        console.error('Error deleting attempts:', attemptsError);
        throw attemptsError;
      }
      
      // Finally delete the quiz itself
      const { error: quizError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizToDelete.id);
        
      if (quizError) {
        console.error('Error deleting quiz:', quizError);
        throw quizError;
      }
      
      // Update local state
      setQuizzes(quizzes.filter(q => q.id !== quizToDelete.id));
      
      toast({
        title: "Quiz Deleted",
        description: `"${quizToDelete.title}" has been deleted successfully.`,
      });
      
      // Reset the quiz to delete
      setQuizToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete quiz:', error);
      toast({
        title: "Error",
        description: `Failed to delete quiz: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete Quiz Alert Dialog
  const renderDeleteQuizDialog = () => {
    return (
      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent className="border-destructive/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-destructive/50" />
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Quiz Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold">"{quizToDelete?.title}"</span>?
              <p className="mt-2 text-sm">
                This will permanently remove the quiz and all associated questions, attempts, and answers. 
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-muted-foreground/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteQuiz}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Use the Navbar component */}
      <Navbar showAdmin={false} />
      
      {/* Admin header with user info - now with gradient background */}
      <header className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 sticky top-0 z-10 border-b border-pink-200/50 dark:border-pink-800/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Admin Dashboard</h2>
                {user && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10">
                <Link to="/admin/quiz/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Quiz
                </Link>
              </Button>
              <Avatar onClick={handleSignOut} className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Render Delete Dialog */}
      {renderDeleteQuizDialog()}
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Quiz Management</h2>
          </div>
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 mb-8">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row justify-between">
              <div className="space-y-3 mb-4 md:mb-0">
                <h3 className="text-xl font-semibold">Welcome to Quiz Dashboard</h3>
                <p className="text-muted-foreground max-w-lg">
                  Easily create and manage quizzes, track participant performance, and analyze results. Create engaging assessments for your audience.
                </p>
                <Button asChild size="sm" className="gap-2">
                  <Link to="/admin/quiz/new">
                    <Rocket className="w-4 h-4" />
                    Create New Quiz
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="flex md:flex-col justify-center gap-3">
                <div className="flex flex-col items-center p-3 bg-white dark:bg-black/20 rounded-lg">
                  <span className="text-2xl font-bold">{quizzes.length}</span>
                  <span className="text-xs text-muted-foreground">Total Quizzes</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white dark:bg-black/20 rounded-lg">
                  <span className="text-2xl font-bold">{quizzes.filter(q => q.is_open).length}</span>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="overflow-hidden border border-primary/20 shadow-sm hover:shadow-md transition-all">
            <div className="h-1.5 bg-primary w-full" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">All Quizzes</CardTitle>
                <div className="p-1.5 bg-primary/10 rounded-full">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">{quizzes.length}</div>
                <div className="text-xs text-muted-foreground pb-1">Total</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {quizzes.length === 1 ? "Quiz Created" : "Quizzes Created"}
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button variant="ghost" size="sm" className="text-xs px-0 h-auto">
                <Link to="/admin/quiz/new" className="flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Quiz
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="overflow-hidden border border-green-500/20 shadow-sm hover:shadow-md transition-all">
            <div className="h-1.5 bg-green-500 w-full" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">Active Quizzes</CardTitle>
                <div className="p-1.5 bg-green-500/10 rounded-full">
                  <CheckSquare className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">{quizzes.filter(q => q.is_open).length}</div>
                <div className="text-xs text-green-600 dark:text-green-400 pb-1">
                  {Math.round((quizzes.filter(q => q.is_open).length / Math.max(quizzes.length, 1)) * 100)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for participants
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button variant="ghost" size="sm" className="text-xs px-0 h-auto">
                <Link to="#active" className="flex items-center gap-1">
                  View Active <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="overflow-hidden border border-blue-500/20 shadow-sm hover:shadow-md transition-all">
            <div className="h-1.5 bg-blue-500 w-full" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <div className="p-1.5 bg-blue-500/10 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">
                  {quizzes.filter(q => 
                    new Date(q.created_at).getMonth() === new Date().getMonth()
                  ).length}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created in {new Date().toLocaleString('default', { month: 'long' })}
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button variant="ghost" size="sm" className="text-xs px-0 h-auto">
                <Link to="#stats" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> View Stats
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="overflow-hidden border border-purple-500/20 shadow-sm hover:shadow-md transition-all">
            <div className="h-1.5 bg-purple-500 w-full" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">Leaderboards</CardTitle>
                <div className="p-1.5 bg-purple-500/10 rounded-full">
                  <Trophy className="h-4 w-4 text-purple-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">
                  {quizzes.length}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available leaderboards
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button variant="ghost" size="sm" className="text-xs px-0 h-auto" asChild>
                <Link to={quizzes.length > 0 ? `/q/${quizzes[0]?.id}/leaderboard` : "#"} className="flex items-center gap-1">
                  View Rankings <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quizzes Content */}
        <div className="mt-10 mb-6 flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Your Quizzes</h2>
        </div>
        
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList className="bg-pink-100/50 p-1 dark:bg-pink-900/20">
              <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-pink-950">All</TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-white dark:data-[state=active]:bg-pink-950">Active</TabsTrigger>
              <TabsTrigger value="closed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-pink-950">Closed</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search quizzes..."
                  className="pl-9 border-pink-200/50 dark:border-pink-800/30 focus-visible:ring-primary/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select 
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[130px] border-pink-200/50 dark:border-pink-800/30">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tab Content */}
          <TabsContent value="all" className="space-y-4">
            {renderQuizzesList(filteredQuizzes)}
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4">
            {renderQuizzesList(quizzes.filter(q => q.is_open))}
          </TabsContent>
          
          <TabsContent value="closed" className="space-y-4">
            {renderQuizzesList(quizzes.filter(q => !q.is_open))}
          </TabsContent>
        </Tabs>
        
        {/* Help Section */}
        <div className="mt-12 bg-muted/30 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Quick Tips</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Create a new quiz by clicking the "New Quiz" button</li>
            <li>Share quiz links or codes with participants</li>
            <li>View leaderboards to track participant performance</li>
            <li>Edit quizzes anytime to update content</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Helper function to render quizzes list
  function renderQuizzesList(quizList: Quiz[]) {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((_, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-sm">
              <div className="h-2 bg-gradient-to-r from-primary/30 to-primary/10" />
              <CardHeader className="pb-0">
                <Skeleton className="h-6 w-4/5 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="pb-0 space-y-4">
                <div className="flex items-center justify-between mt-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-full" />
              </CardContent>
              <CardFooter className="pt-0 pb-4 flex justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (quizList.length === 0) {
      return (
        <Card className="text-center py-12 border-dashed border-2 shadow-none bg-muted/30">
          <CardContent>
            <div className="p-6 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <PieChart className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No quizzes found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery 
                ? "Try a different search term or filter to find your quizzes." 
                : "Create your first quiz to get started with your assessment journey."
              }
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/admin/quiz/new">
                <Plus className="w-4 h-4" />
                Create New Quiz
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizList.map((quiz) => (
          <Card key={quiz.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
            {/* Colored header indicator based on status */}
            <div className={`h-1.5 w-full ${quiz.is_open ? "bg-gradient-to-r from-primary to-primary/50" : "bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/10"}`} />
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <Badge variant={quiz.is_open ? "default" : "secondary"} className="ml-auto">
                      {quiz.is_open ? "Active" : "Closed"}
                    </Badge>
                  </div>
                  {quiz.description && (
                    <CardDescription className="line-clamp-1">{quiz.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {quiz.time_per_question_sec 
                      ? `${quiz.time_per_question_sec}s per question`
                      : "No time limit"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {/* Quiz Code */}
              {quiz.quiz_code && (
                <div className="flex items-center justify-between p-2.5 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-background">Code</Badge>
                    <span className="font-mono text-sm font-medium tracking-wider">{quiz.quiz_code}</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0" 
                          onClick={() => {
                            navigator.clipboard.writeText(quiz.quiz_code);
                            toast({
                              title: "Code Copied",
                              description: "Quiz code copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy quiz code</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between w-full">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyQuizLink(quiz.id)} 
                  className="text-xs h-8 hover:bg-primary/10 hover:text-primary"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Share Quiz
                </Button>
                
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link to={`/q/${quiz.id}/leaderboard`}>
                      <Trophy className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link to={`/admin/quiz/${quiz.id}`}>
                      <Settings className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="flex w-full gap-2">
                {quiz.is_open ? (
                  <Button variant="default" size="sm" asChild className="flex-1 h-9">
                    <Link to={`/q/${quiz.id}`}>
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      Take Quiz
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild className="flex-1 h-9">
                    <Link to={`/admin/quiz/${quiz.id}`}>
                      <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                      View Details
                    </Link>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setQuizToDelete(quiz)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
};

export default AdminDashboard;