import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Trophy, Clock, Home, ArrowRight, Medal, Crown, Award, 
  Users, Calendar, BookOpen, Timer, User, Share2, Info, 
  Rocket, Sparkles, ArrowUpRight, Filter, BarChart3,
  ChevronUp, Star, Bookmark, RefreshCw, Zap, Activity
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Quiz } from "@/types/quiz";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";

// Define the participant type for leaderboard
interface Participant {
  id: string;
  name: string;
  total_correct: number;
  total_time_ms: number;
  submitted_at: string;
  accuracy?: number; // Calculated field
  rank?: number; // Calculated field
  avatarUrl?: string; // Optional avatar URL
}

// Time period for filtering leaderboard
type TimePeriod = 'all' | 'today' | 'week' | 'month';

// Sorting options
type SortOption = 'score' | 'time' | 'accuracy';

// Badge data based on performance
interface PerformanceBadge {
  label: string;
  color: string;
  icon: JSX.Element;
}

const Leaderboard = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAttemptId, setUserAttemptId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('score');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    highestScore: 0,
    averageScore: 0,
    averageAccuracy: 0,
    averageTime: 0,
    totalParticipants: 0
  });

  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      if (refreshing) setRefreshing(true);

      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      // Add quiz_code property to match Quiz type
      setQuiz({
        ...quizData,
        quiz_code: '' // Add the required property with an empty string default
      } as Quiz);

      // Prepare date filter based on time period
      let dateFilter = {};
      const now = new Date();
      
      if (timePeriod === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        dateFilter = { submitted_at: { gte: today } };
      } else if (timePeriod === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { submitted_at: { gte: weekAgo.toISOString() } };
      } else if (timePeriod === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { submitted_at: { gte: monthAgo.toISOString() } };
      }

      // Fetch all completed attempts for this quiz
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .select('id, name, total_correct, total_time_ms, submitted_at')
        .eq('quiz_id', quizId)
        .not('submitted_at', 'is', null)
        .order('total_correct', { ascending: false })
        .order('total_time_ms', { ascending: true });

      if (attemptError) throw attemptError;
      
      // Process participants - add rank and calculate accuracy
      if (attemptData) {
        // Fetch quiz questions count to calculate accuracy
        let questionCount = 0;
        try {
          const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quizId);
            
          if (!error && count !== null) {
            questionCount = count;
          }
        } catch (e) {
          console.error("Error fetching question count:", e);
        }
        
        const processedData = attemptData.map((participant, index) => {
          // Calculate accuracy based on question count
          const accuracy = questionCount > 0 
            ? (participant.total_correct / questionCount) * 100 
            : 0;
          
          // Add rank and accuracy
          return {
            ...participant,
            rank: index + 1,
            accuracy: Math.round(accuracy),
            // Generate a placeholder avatar URL using initials (you can replace this with real avatars)
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(participant.name)}&backgroundColor=random`
          };
        });
        
        // Sort the data based on the selected sort option
        let sortedData = [...processedData];
        if (sortOption === 'time') {
          sortedData.sort((a, b) => a.total_time_ms - b.total_time_ms);
        } else if (sortOption === 'accuracy') {
          sortedData.sort((a, b) => {
            // Sort by accuracy first, then by score if accuracy is tied
            if (b.accuracy === a.accuracy) {
              return b.total_correct - a.total_correct;
            }
            return b.accuracy! - a.accuracy!;
          });
        }
        
        // Reassign ranks after sorting
        sortedData = sortedData.map((participant, index) => ({
          ...participant,
          rank: index + 1
        }));
        
        setParticipants(sortedData);
        
        // Calculate statistics
        if (sortedData.length > 0) {
          const totalParticipants = sortedData.length;
          const highestScore = Math.max(...sortedData.map(p => p.total_correct));
          const averageScore = sortedData.reduce((sum, p) => sum + p.total_correct, 0) / totalParticipants;
          const averageAccuracy = sortedData.reduce((sum, p) => sum + (p.accuracy || 0), 0) / totalParticipants;
          const averageTime = sortedData.reduce((sum, p) => sum + p.total_time_ms, 0) / totalParticipants;
          
          setStats({
            highestScore,
            averageScore,
            averageAccuracy,
            averageTime,
            totalParticipants
          });
        }
        
        // Find user's rank if they have an attempt
        if (userAttemptId) {
          const userParticipant = sortedData.find(p => p.id === userAttemptId);
          if (userParticipant) {
            setUserRank(userParticipant.rank);
          }
        }
      }

    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quizId, toast, timePeriod, userAttemptId, sortOption, refreshing]);

  useEffect(() => {
    // Check if user has just completed a quiz
    const attemptId = sessionStorage.getItem('completedAttemptId');
    if (attemptId) {
      setUserAttemptId(attemptId);
    }

    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Format time for display
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };
  
  // Get initial letter for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get formatted date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  // Get color based on rank
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-pink-500';
    if (rank === 2) return 'bg-pink-400';
    if (rank === 3) return 'bg-pink-300';
    return 'bg-pink-200 text-pink-800';
  };
  
  // Get appropriate icon for rank
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4" />;
    if (rank === 2) return <Award className="h-4 w-4" />;
    if (rank === 3) return <Medal className="h-4 w-4" />;
    return <span>{rank}</span>;
  };
  
  // Get gradient styles based on rank
  const getRankGradient = (rank: number) => {
    if (rank === 1) return 'from-amber-500/20 to-amber-500/5';
    if (rank === 2) return 'from-gray-400/20 to-gray-400/5';
    if (rank === 3) return 'from-amber-700/20 to-amber-700/5';
    return 'from-primary/10 to-transparent';
  };
  
  // Get a performance badge based on participant stats
  const getPerformanceBadge = (participant: Participant, questionCount: number): PerformanceBadge | null => {
    // Perfect score
    if (participant.total_correct === questionCount) {
      return {
        label: 'Perfect Score',
        color: 'bg-green-500',
        icon: <Star className="h-3 w-3" />
      };
    }
    
    // Fast solver - completed in less than average time * 0.7
    if (participant.total_time_ms < stats.averageTime * 0.7) {
      return {
        label: 'Speed Demon',
        color: 'bg-blue-500',
        icon: <Zap className="h-3 w-3" />
      };
    }
    
    // High accuracy but not perfect
    if (participant.accuracy && participant.accuracy > 85 && participant.total_correct < questionCount) {
      return {
        label: 'Sharpshooter',
        color: 'bg-violet-500',
        icon: <Activity className="h-3 w-3" />
      };
    }
    
    return null;
  };
  
  // Refresh leaderboard data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboardData();
  };
  
  // Filter participants based on time period
  const filteredParticipants = useMemo(() => {
    if (timePeriod === 'all') return participants;
    
    const now = new Date();
    const filterDate = new Date(now);
    
    if (timePeriod === 'today') {
      filterDate.setHours(0, 0, 0, 0);
    } else if (timePeriod === 'week') {
      filterDate.setDate(filterDate.getDate() - 7);
    } else if (timePeriod === 'month') {
      filterDate.setMonth(filterDate.getMonth() - 1);
    }
    
    return participants.filter(p => new Date(p.submitted_at) >= filterDate);
  }, [participants, timePeriod]);

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="text-center mb-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading leaderboard...</p>
          </div>
          
          {/* Skeleton UI for better loading experience */}
          <Card className="mb-8">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-center my-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4 mx-auto mb-4" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <CardContent className="flex flex-col items-center">
            <div className="mb-4 p-4 bg-muted rounded-full">
              <Info className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This quiz doesn't exist or has been deleted.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                <span>Go to Home</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar showAdmin={false} showLeaderboard={true} quizId={quizId} />
      
      <div 
        className="bg-gradient-to-b from-pink-50 via-pink-50/70 to-transparent pt-6 pb-12 mb-6 relative overflow-hidden dark:from-pink-950/30 dark:via-pink-950/10"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 dark:bg-pink-900/50 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-200 dark:bg-pink-900/50 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        </div>
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <Card className="border-0 shadow-md overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-black/60">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex p-4 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
                    <Trophy className="w-10 h-10 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-3xl font-extrabold tracking-tight text-pink-700 dark:text-pink-300">Leaderboard</h1>
                      <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:hover:bg-pink-900/60 h-6" variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {filteredParticipants.length} {filteredParticipants.length === 1 ? 'Participant' : 'Participants'}
                      </Badge>
                      {refreshing && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 animate-pulse h-6">
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Refreshing...
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-pink-600/70 dark:text-pink-400/70">{quiz.title}</h2>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {userRank && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800/50">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${getRankColor(userRank)}`}>
                        {userRank <= 3 ? getRankIcon(userRank) : userRank}
                      </div>
                      <span className="font-medium text-pink-700 dark:text-pink-300">Your Rank</span>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  {quiz.is_open && (
                    <Button asChild variant="outline" className="gap-2 border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30">
                      <Link to={`/q/${quizId}`}>
                        <Rocket className="w-4 h-4" />
                        <span>Take Quiz</span>
                      </Link>
                    </Button>
                  )}
                  
                  <Button asChild className="gap-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-700 dark:hover:bg-pink-600">
                    <Link to="/">
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-6 text-sm">
                {quiz.time_per_question_sec && (
                  <div className="flex items-center bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-full">
                    <Timer className="w-3.5 h-3.5 mr-1.5" />
                    <span>{quiz.time_per_question_sec} sec per question</span>
                  </div>
                )}
                <div className="flex items-center bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  <span>Created {formatDate(quiz.created_at)}</span>
                </div>
                {quiz.is_open ? (
                  <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full">
                    <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                    <span>Open for participants</span>
                  </div>
                ) : (
                  <div className="flex items-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full">
                    <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                    <span>Closed</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Stats and Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-8">
          {/* Stats Card */}
          <div className="col-span-1 lg:col-span-4">
            <Card className="h-full border-0 bg-pink-50 dark:bg-pink-950/20 shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-lg text-pink-600 dark:text-pink-400 font-semibold">
                  <BarChart3 className="w-5 h-5" />
                  <span>Quiz Performance Overview</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col p-4 rounded-lg bg-white dark:bg-black/40 border border-pink-100 dark:border-pink-900/30">
                    <span className="text-sm text-muted-foreground mb-1">Participants</span>
                    <span className="text-3xl font-bold text-pink-800 dark:text-pink-200">{stats.totalParticipants}</span>
                  </div>
                  
                  <div className="flex flex-col p-4 rounded-lg bg-white dark:bg-black/40 border border-pink-100 dark:border-pink-900/30">
                    <span className="text-sm text-muted-foreground mb-1">Avg. Score</span>
                    <span className="text-3xl font-bold text-pink-800 dark:text-pink-200">{stats.totalParticipants > 0 ? stats.averageScore.toFixed(1) : '-'}</span>
                  </div>
                  
                  <div className="flex flex-col p-4 rounded-lg bg-white dark:bg-black/40 border border-pink-100 dark:border-pink-900/30">
                    <span className="text-sm text-muted-foreground mb-1">Avg. Accuracy</span>
                    <span className="text-3xl font-bold text-pink-800 dark:text-pink-200">{stats.totalParticipants > 0 ? `${Math.round(stats.averageAccuracy)}%` : '-'}</span>
                  </div>
                  
                  <div className="flex flex-col p-4 rounded-lg bg-white dark:bg-black/40 border border-pink-100 dark:border-pink-900/30">
                    <span className="text-sm text-muted-foreground mb-1">Avg. Time</span>
                    <span className="text-3xl font-bold text-pink-800 dark:text-pink-200">{stats.totalParticipants > 0 ? formatTime(stats.averageTime) : '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filters Card */}
          <div className="col-span-1 lg:col-span-3">
            <Card className="h-full border-0 bg-pink-50 dark:bg-pink-950/20 shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-lg text-pink-600 dark:text-pink-400 font-semibold">
                  <Filter className="w-5 h-5" />
                  <span>Filter Results</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Time period filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-pink-700 dark:text-pink-300">Time Period</label>
                  <div className="bg-white dark:bg-black/40 p-1 rounded-lg border border-pink-100 dark:border-pink-900/30">
                    <Tabs 
                      defaultValue="all" 
                      className="w-full"
                      onValueChange={(value) => setTimePeriod(value as TimePeriod)}
                    >
                      <TabsList className="grid grid-cols-4 w-full bg-transparent">
                        <TabsTrigger 
                          value="all"
                          className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                        >All</TabsTrigger>
                        <TabsTrigger 
                          value="month"
                          className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                        >Month</TabsTrigger>
                        <TabsTrigger 
                          value="week"
                          className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                        >Week</TabsTrigger>
                        <TabsTrigger 
                          value="today"
                          className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                        >Today</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                
                {/* Sort options */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-pink-700 dark:text-pink-300">Sort By</label>
                  <div className="bg-white dark:bg-black/40 p-1 rounded-lg border border-pink-100 dark:border-pink-900/30">
                    <Tabs 
                      defaultValue="score" 
                      className="w-full"
                      onValueChange={(value) => setSortOption(value as SortOption)}
                    >
                      <TabsList className="grid grid-cols-3 w-full bg-transparent">
                        <TabsTrigger 
                          value="score"
                          className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                        >Score</TabsTrigger>
                        <TabsTrigger 
                          value="time"
                          className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                        >Time</TabsTrigger>
                        <TabsTrigger 
                          value="accuracy"
                          className="data-[state=active]:bg-pink-600 data-[state=active]:text-white"
                        >Accuracy</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top 3 Winners Podium */}
        {filteredParticipants.length > 0 && (
          <div className="mb-10 relative">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span>Top Performers</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-6 items-end">
              {/* Second Place */}
              {filteredParticipants.length > 1 && (
                <Card 
                  className="md:col-span-2 md:order-1 border-pink-300 bg-gradient-to-b from-pink-50/80 to-white dark:from-pink-900/20 dark:to-black/70 shadow-md transform hover:scale-[1.02] transition-all"
                >
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-pink-400 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                      <Award className="h-4 w-4" />
                    </div>
                    
                    <div className="pt-4 mb-3 flex justify-center">
                      <Avatar className="h-16 w-16 border-2 border-pink-300 shadow-sm">
                        {filteredParticipants[1].avatarUrl ? (
                          <AvatarImage src={filteredParticipants[1].avatarUrl} alt={filteredParticipants[1].name} />
                        ) : (
                          <AvatarFallback className="bg-pink-400 text-white">
                            {getInitials(filteredParticipants[1].name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    
                    <h3 className="font-bold text-lg flex items-center justify-center gap-1">
                      {filteredParticipants[1].name}
                      {filteredParticipants[1].id === userAttemptId && (
                        <Badge variant="outline" className="text-xs bg-pink-200/80 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">You</Badge>
                      )}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/20 rounded-md p-2">
                        <div className="text-xs text-pink-600/70 dark:text-pink-400/70">Score</div>
                        <div className="text-lg font-bold text-pink-700 dark:text-pink-300">{filteredParticipants[1].total_correct}</div>
                      </div>
                      <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/20 rounded-md p-2">
                        <div className="text-xs text-pink-600/70 dark:text-pink-400/70">Accuracy</div>
                        <div className="text-lg font-bold text-pink-700 dark:text-pink-300">{filteredParticipants[1].accuracy}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-pink-600/70 dark:text-pink-400/70 flex items-center justify-center">
                      <Clock className="w-3 h-3 mr-1" /> {formatTime(filteredParticipants[1].total_time_ms)}
                    </div>
                  </CardContent>
                  
                  <div className="bg-pink-50 dark:bg-pink-900/20 py-3 text-center font-medium text-pink-700 dark:text-pink-300 border-t border-pink-100 dark:border-pink-800/20">
                    2nd Place 🥈
                  </div>
                </Card>
              )}
              
              {/* First Place */}
              <Card 
                className="md:col-span-3 md:order-2 border-pink-500 bg-gradient-to-b from-pink-50 to-white dark:from-pink-900/30 dark:to-black/70 shadow-xl transform hover:scale-[1.03] transition-all"
              >
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-4 w-28 h-7 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  <Crown className="h-3 w-3 mr-1" /> Champion
                </div>
                
                <CardContent className="p-8 pt-10 text-center relative">
                  <div className="pt-1 mb-4 flex justify-center">
                    <Avatar className="h-24 w-24 ring-4 ring-pink-500 ring-offset-2 dark:ring-offset-black shadow-xl">
                      {filteredParticipants[0].avatarUrl ? (
                        <AvatarImage src={filteredParticipants[0].avatarUrl} alt={filteredParticipants[0].name} />
                      ) : (
                        <AvatarFallback className="bg-pink-500 text-white text-2xl">
                          {getInitials(filteredParticipants[0].name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  
                  <h3 className="font-bold text-xl mb-1 flex items-center justify-center gap-1">
                    {filteredParticipants[0].name}
                    {filteredParticipants[0].id === userAttemptId && (
                      <Badge variant="outline" className="bg-pink-200/80 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">You</Badge>
                    )}
                  </h3>
                  
                  <Progress
                    className="h-2 mb-3 bg-pink-100 dark:bg-pink-900/40"
                    indicatorClassName="bg-pink-500"
                    value={filteredParticipants[0].accuracy}
                  />
                  
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 rounded-md p-3">
                      <div className="text-xs text-pink-600/70 dark:text-pink-400/70">Score</div>
                      <div className="text-xl font-bold text-pink-700 dark:text-pink-300">{filteredParticipants[0].total_correct}</div>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 rounded-md p-3">
                      <div className="text-xs text-pink-600/70 dark:text-pink-400/70">Accuracy</div>
                      <div className="text-xl font-bold text-pink-700 dark:text-pink-300">{filteredParticipants[0].accuracy}%</div>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 rounded-md p-3">
                      <div className="text-xs text-pink-600/70 dark:text-pink-400/70">Time</div>
                      <div className="text-xl font-bold text-pink-700 dark:text-pink-300">{formatTime(filteredParticipants[0].total_time_ms)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                      <Crown className="w-3 h-3 mr-1" /> Top Performer
                    </Badge>
                  </div>
                </CardContent>
                
                <div className="bg-pink-100 dark:bg-pink-900/40 py-4 text-center font-bold text-pink-700 dark:text-pink-300 border-t border-pink-200 dark:border-pink-800">
                  1st Place 🏆
                </div>
              </Card>
              
              {/* Third Place */}
              {filteredParticipants.length > 2 && (
                <Card 
                  className="md:col-span-2 md:order-3 border-pink-200 bg-gradient-to-b from-pink-50/30 to-white dark:from-pink-900/10 dark:to-black/70 shadow-sm transform hover:scale-[1.02] transition-all"
                >
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-pink-300 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                      <Medal className="h-4 w-4" />
                    </div>
                    
                    <div className="pt-4 mb-3 flex justify-center">
                      <Avatar className="h-16 w-16 border-2 border-pink-200 shadow-sm">
                        {filteredParticipants[2].avatarUrl ? (
                          <AvatarImage src={filteredParticipants[2].avatarUrl} alt={filteredParticipants[2].name} />
                        ) : (
                          <AvatarFallback className="bg-pink-300 text-white">
                            {getInitials(filteredParticipants[2].name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    
                    <h3 className="font-bold text-lg flex items-center justify-center gap-1">
                      {filteredParticipants[2].name}
                      {filteredParticipants[2].id === userAttemptId && (
                        <Badge variant="outline" className="text-xs bg-pink-200/80 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">You</Badge>
                      )}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-800/10 rounded-md p-2">
                        <div className="text-xs text-pink-600/70 dark:text-pink-400/70">Score</div>
                        <div className="text-lg font-bold text-pink-700 dark:text-pink-300">{filteredParticipants[2].total_correct}</div>
                      </div>
                      <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-800/10 rounded-md p-2">
                        <div className="text-xs text-pink-600/70 dark:text-pink-400/70">Accuracy</div>
                        <div className="text-lg font-bold text-pink-700 dark:text-pink-300">{filteredParticipants[2].accuracy}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-pink-600/70 dark:text-pink-400/70 flex items-center justify-center">
                      <Clock className="w-3 h-3 mr-1" /> {formatTime(filteredParticipants[2].total_time_ms)}
                    </div>
                  </CardContent>
                  
                  <div className="bg-pink-50 dark:bg-pink-900/10 py-3 text-center font-medium text-pink-700 dark:text-pink-300 border-t border-pink-100 dark:border-pink-800/10">
                    3rd Place 🥉
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Main Leaderboard Table */}
        <Card className="shadow-md border-0 mb-8">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-pink-50 to-transparent dark:from-pink-950/20 dark:to-transparent">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
                  <ChevronUp className="w-5 h-5" />
                  <span>Full Rankings</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1 text-pink-600/70 dark:text-pink-400/70">
                  <Info className="w-3 h-3" />
                  <span>{sortOption === 'score' ? 'By highest score, then fastest time' : 
                         sortOption === 'time' ? 'By fastest completion time' : 
                         'By highest accuracy, then highest score'}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-20 h-20 mx-auto mb-4 text-pink-300 dark:text-pink-800 opacity-30" />
                <p className="font-medium text-xl text-pink-700 dark:text-pink-300">No participants yet</p>
                <p className="text-sm text-pink-600/70 dark:text-pink-400/70 mt-2 max-w-sm mx-auto">
                  Be the first to complete this quiz and claim the top spot on the leaderboard!
                </p>
                {quiz.is_open && (
                  <Button asChild variant="outline" className="mt-6 gap-2 border-pink-300 text-pink-700 dark:border-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/30">
                    <Link to={`/q/${quizId}`}>
                      <Rocket className="w-4 h-4" />
                      <span>Take Quiz Now</span>
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-pink-100 dark:border-b-pink-900/30">
                      <TableHead className="w-[70px] text-pink-700 dark:text-pink-300">Rank</TableHead>
                      <TableHead className="text-pink-700 dark:text-pink-300">Participant</TableHead>
                      <TableHead className="text-center text-pink-700 dark:text-pink-300">Score</TableHead>
                      <TableHead className="text-center text-pink-700 dark:text-pink-300">Accuracy</TableHead>
                      <TableHead className="text-center text-pink-700 dark:text-pink-300">Time</TableHead>
                      <TableHead className="text-center hidden md:table-cell text-pink-700 dark:text-pink-300">Completed</TableHead>
                      <TableHead className="w-[100px] hidden md:table-cell text-pink-700 dark:text-pink-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant, index) => {
                      // Calculate question count from accuracy and total_correct
                      const questionCount = participant.accuracy ? 
                        Math.round(participant.total_correct / (participant.accuracy / 100)) : 0;
                      
                      // Get performance badge if available
                      const performanceBadge = getPerformanceBadge(participant, questionCount);
                      
                      // Get rank color based on our new theme
                      const getRankColorThemed = (rank: number) => {
                        if (rank === 1) return 'bg-pink-500';
                        if (rank === 2) return 'bg-pink-400';
                        if (rank === 3) return 'bg-pink-300';
                        return 'bg-pink-200 text-pink-700';
                      };
                      
                      return (
                        <TableRow 
                          key={participant.id} 
                          className={participant.id === userAttemptId ? 
                            `bg-pink-50/50 hover:bg-pink-50/80 dark:bg-pink-950/10 dark:hover:bg-pink-950/20 border-l-4 border-pink-500 dark:border-pink-400` : 
                            index % 2 === 0 ? 'bg-pink-50/30 dark:bg-pink-950/5 hover:bg-pink-50/50 dark:hover:bg-pink-950/10' : 
                            'hover:bg-pink-50/30 dark:hover:bg-pink-950/5'}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1">
                              {index < 3 ? (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${getRankColorThemed(index+1)}`}>
                                  {getRankIcon(index+1)}
                                </div>
                              ) : (
                                <span className="text-pink-600/70 dark:text-pink-400/70 px-1.5">{index + 1}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-pink-100 dark:border-pink-800/30">
                                {participant.avatarUrl ? (
                                  <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                                ) : (
                                  <AvatarFallback className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">{getInitials(participant.name)}</AvatarFallback>
                                )}
                              </Avatar>
                              <div className="font-medium flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span className="text-pink-800 dark:text-pink-200">{participant.name}</span>
                                {participant.id === userAttemptId && (
                                  <Badge className="text-[10px] h-4 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50 w-fit" variant="outline">
                                    You
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-bold text-lg text-pink-700 dark:text-pink-300">{participant.total_correct}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/20 px-2 py-1 rounded text-sm font-medium text-pink-700 dark:text-pink-300">
                              {participant.accuracy}%
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-pink-600/70 dark:text-pink-400/70">
                              <Clock className="w-3 h-3" /> 
                              <span>{formatTime(participant.total_time_ms)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm text-pink-600/70 dark:text-pink-400/70 hidden md:table-cell">
                            {formatDate(participant.submitted_at)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {performanceBadge && (
                              <Badge className={`${performanceBadge.color} hover:${performanceBadge.color}/90`}>
                                {performanceBadge.icon}
                                <span className="ml-1">{performanceBadge.label}</span>
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-between p-4 gap-4 border-t border-pink-100 dark:border-pink-900/20">
            <div className="text-sm text-pink-600/70 dark:text-pink-400/70">
              {timePeriod !== 'all' && `Showing results for ${timePeriod === 'today' ? 'today' : timePeriod === 'week' ? 'this week' : 'this month'} • `}
              {filteredParticipants.length} {filteredParticipants.length === 1 ? 'participant' : 'participants'}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1 border-pink-200 dark:border-pink-800/30 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20" 
                onClick={handleRefresh} 
                disabled={refreshing}
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1 border-pink-200 dark:border-pink-800/30 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Actions */}
        <div className="mt-12 mb-6 flex flex-col md:flex-row gap-6 justify-center items-center">
          <Button 
            asChild 
            className="gap-2 w-full md:w-auto bg-pink-600 hover:bg-pink-700 dark:bg-pink-700 dark:hover:bg-pink-600"
          >
            {quiz.is_open ? (
              <Link to={`/q/${quizId}`}>
                <Rocket className="w-4 h-4" />
                <span>Take This Quiz</span>
              </Link>
            ) : (
              <Link to="/">
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            )}
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="gap-2 w-full md:w-auto border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            <Link to="/">
              <ArrowUpRight className="w-4 h-4" />
              <span>Explore More Quizzes</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;