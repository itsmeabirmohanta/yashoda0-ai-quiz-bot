import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Trophy, Clock, Home, ArrowRight, Medal, Crown, Award, 
  Users, Calendar, BookOpen, Timer, User, Share2, Info, 
  Rocket, Sparkles, ArrowUpRight
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Quiz } from "@/types/quiz";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
}

// Time period for filtering leaderboard
type TimePeriod = 'all' | 'today' | 'week' | 'month';

const Leaderboard = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAttemptId, setUserAttemptId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [userRank, setUserRank] = useState<number | null>(null);

  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

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
            accuracy: Math.round(accuracy)
          };
        });
        
        setParticipants(processedData);
        
        // Find user's rank if they have an attempt
        if (userAttemptId) {
          const userParticipant = processedData.find(p => p.id === userAttemptId);
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
    }
  }, [quizId, toast, timePeriod, userAttemptId]);

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
    if (rank === 1) return 'bg-amber-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-700';
    return 'bg-primary';
  };
  
  // Get appropriate icon for rank
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4" />;
    if (rank === 2) return <Award className="h-4 w-4" />;
    if (rank === 3) return <Medal className="h-4 w-4" />;
    return <span>{rank}</span>;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <CardContent>
            <h2 className="text-2xl font-bold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This quiz doesn't exist or has been deleted.
            </p>
            <Button asChild>
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar showAdmin={false} showLeaderboard={true} quizId={quizId} />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header with Quiz Info Card */}
        <div className="mb-8">
          <Card className="border-2 overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/5 z-0"></div>
              <div className="relative z-10 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-primary/20 rounded-xl mr-4">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
                        Leaderboard 
                        <Badge className="ml-3 bg-primary/20 text-primary hover:bg-primary/30" variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {filteredParticipants.length}
                        </Badge>
                      </h1>
                      <h2 className="text-lg sm:text-xl font-medium text-muted-foreground mt-1">{quiz.title}</h2>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {userRank && (
                      <div className="flex items-center space-x-1 p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Your rank: <span className="font-bold">{userRank}</span></span>
                      </div>
                    )}
                    
                    {quiz.is_open && (
                      <Button asChild variant="outline" className="gap-1 border border-primary/30 text-primary hover:bg-primary/10">
                        <Link to={`/q/${quizId}`}>
                          <Rocket className="w-4 h-4" />
                          <span className="hidden sm:inline">Take Quiz</span>
                        </Link>
                      </Button>
                    )}
                    
                    <Button asChild variant="default" className="gap-1">
                      <Link to="/">
                        <Home className="w-4 h-4" />
                        <span className="hidden sm:inline">Home</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
                  {quiz.time_per_question_sec && (
                    <div className="flex items-center">
                      <Timer className="w-3 h-3 mr-1" />
                      <span>{quiz.time_per_question_sec} sec per question</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    <span>Created {formatDate(quiz.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Time period filter */}
        <div className="mb-6">
          <Tabs 
            defaultValue="all" 
            className="w-full"
            onValueChange={(value) => setTimePeriod(value as TimePeriod)}
          >
            <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Top 3 Winners Highlight */}
        {filteredParticipants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {filteredParticipants.slice(0, 3).map((participant, index) => (
              <Card 
                key={participant.id} 
                className={`
                  ${index === 0 ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : ''} 
                  ${index === 1 ? 'border-gray-400 shadow-md' : ''} 
                  ${index === 2 ? 'border-amber-700 shadow-sm' : ''}
                  transition-all hover:shadow-lg
                `}
              >
                <CardContent className="p-6 text-center relative">
                  {/* Position Badge */}
                  <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${getRankColor(index+1)} text-white w-8 h-8 rounded-full flex items-center justify-center shadow`}>
                    {getRankIcon(index + 1)}
                  </div>
                  
                  {/* Avatar */}
                  <div className="pt-4 mb-3 flex justify-center">
                    <Avatar className={`h-16 w-16 ${index === 0 ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}>
                      <AvatarFallback className={`
                        ${index === 0 ? 'bg-amber-500 text-white' : ''} 
                        ${index === 1 ? 'bg-gray-400 text-white' : ''} 
                        ${index === 2 ? 'bg-amber-700 text-white' : ''}
                      `}>
                        {getInitials(participant.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* User info */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg flex items-center justify-center gap-1">
                      {participant.name}
                      {participant.id === userAttemptId && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary">You</Badge>
                      )}
                    </h3>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-muted rounded-md p-2">
                        <div className="text-xs text-muted-foreground">Score</div>
                        <div className="text-lg font-bold">{participant.total_correct}</div>
                      </div>
                      <div className="bg-muted rounded-md p-2">
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                        <div className="text-lg font-bold">{participant.accuracy}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-muted-foreground flex items-center justify-center">
                      <Clock className="w-3 h-3 mr-1" /> {formatTime(participant.total_time_ms)}
                    </div>
                    
                    {/* Special badge for first place */}
                    {index === 0 && (
                      <div className="mt-2">
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                          <Crown className="w-3 h-3 mr-1" /> Top Performer
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Leaderboard Table */}
        <Card className="shadow-md border-2 mb-8">
          <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span>Full Rankings</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Info className="w-3 h-3" />
              <span>Sorted by most correct answers, then fastest time</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="font-medium text-lg">No participants yet</p>
                <p className="text-sm text-muted-foreground mt-2">Be the first to complete this quiz!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Accuracy</TableHead>
                      <TableHead className="text-center">Time</TableHead>
                      <TableHead className="text-center">Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant, index) => (
                      <TableRow key={participant.id} className={participant.id === userAttemptId ? 'bg-primary/5 hover:bg-primary/10' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {index < 3 ? (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${getRankColor(index+1)}`}>
                                {getRankIcon(index+1)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-muted">{getInitials(participant.name)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium flex items-center gap-1">
                              {participant.name}
                              {participant.id === userAttemptId && (
                                <Badge className="ml-1 text-[10px] h-4 bg-primary/20 text-primary hover:bg-primary/30" variant="outline">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">{participant.total_correct}</TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center bg-muted px-1.5 py-0.5 rounded text-sm">
                            {participant.accuracy}%
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {formatTime(participant.total_time_ms)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {formatDate(participant.submitted_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {filteredParticipants.length} {filteredParticipants.length === 1 ? 'participant' : 'participants'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Quiz Stats */}
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Quiz Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="text-2xl font-bold">
                  {participants.length > 0 ? 
                    (participants.reduce((sum, p) => sum + p.total_correct, 0) / participants.length).toFixed(1) : 
                    '-'}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Average Accuracy</span>
                <span className="text-2xl font-bold">
                  {participants.length > 0 && participants[0].accuracy !== undefined ? 
                    `${(participants.reduce((sum, p) => sum + (p.accuracy || 0), 0) / participants.length).toFixed(0)}%` : 
                    '-'}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Average Time</span>
                <span className="text-2xl font-bold">
                  {participants.length > 0 ? 
                    formatTime(participants.reduce((sum, p) => sum + p.total_time_ms, 0) / participants.length) : 
                    '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <ArrowUpRight className="w-4 h-4" />
              <span>Explore more quizzes</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;