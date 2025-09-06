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
  Filter
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

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    const link = `${window.location.origin}/q/${quizId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Quiz link copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Use the Navbar component */}
      <Navbar showAdmin={false} />
      
      {/* Admin header with user info */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="mr-1">Admin</Badge>
                {user && (
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="default">
                <Link to="/admin/quiz/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Quiz
                </Link>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleSignOut}>
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Quiz Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your quizzes, view analytics, and create new assessments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Layers className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {quizzes.length === 1 ? "Quiz Created" : "Quizzes Created"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:border-green-500/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Quizzes</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full">
                <CheckSquare className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quizzes.filter(q => q.is_open).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((quizzes.filter(q => q.is_open).length / Math.max(quizzes.length, 1)) * 100)}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:border-blue-500/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quizzes.filter(q => 
                  new Date(q.created_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created in {new Date().toLocaleString('default', { month: 'long' })}
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:border-orange-500/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timed Quizzes</CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-full">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quizzes.filter(q => q.time_per_question_sec !== null).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                With time restrictions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quizzes Content */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Quizzes</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search quizzes..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select 
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[130px]">
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
      </div>
    </div>
  );

  // Helper function to render quizzes list
  function renderQuizzesList(quizList: Quiz[]) {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/5" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (quizList.length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <PieChart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term or filter" : "Create your first quiz to get started with SwiftQuiz."}
            </p>
            <Button asChild>
              <Link to="/admin/quiz/new">
                <Plus className="w-4 h-4 mr-2" />
                Create New Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {quizList.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-md transition-all overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{quiz.title}</CardTitle>
                  {quiz.description && (
                    <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center">
                  <Badge variant={quiz.is_open ? "default" : "secondary"} className="ml-2">
                    {quiz.is_open ? "Active" : "Closed"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {quiz.time_per_question_sec 
                      ? `${quiz.time_per_question_sec}s per question`
                      : "No time limit"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {/* Quiz Code */}
              {quiz.quiz_code && (
                <div className="mt-1 mb-1 flex items-center justify-between p-2 bg-secondary/30 rounded-md">
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">Quiz Code:</span>
                    <span className="font-mono font-semibold tracking-wider">{quiz.quiz_code}</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2" 
                          onClick={() => {
                            navigator.clipboard.writeText(quiz.quiz_code);
                            toast({
                              title: "Code Copied",
                              description: "Quiz code copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="w-3 h-3" />
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
            <CardFooter className="flex justify-between pt-2 border-t bg-muted/50">
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => copyQuizLink(quiz.id)}>
                        <ClipboardCopy className="w-4 h-4 mr-1" />
                        Copy Link
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy shareable quiz link</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/quiz/${quiz.id}`}>
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                {quiz.is_open && (
                  <Button variant="default" size="sm" asChild>
                    <Link to={`/q/${quiz.id}`}>
                      <Users className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
};

export default AdminDashboard;