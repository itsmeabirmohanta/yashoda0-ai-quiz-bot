import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Trophy, Clock, PenLine, Play, Share2, Award } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/useAuth";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { user } = useAuth();
  const [quizCode, setQuizCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [charInputs, setCharInputs] = useState<string[]>(["", "", "", "", "", ""]);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [recentParticipants, setRecentParticipants] = useState<{name: string, score: string}[]>([
    { name: "Olivia", score: "9/10" },
    { name: "Noah", score: "8/10" },
    { name: "Emma", score: "7/10" },
  ]);

  // Update the full quiz code whenever individual characters change
  useEffect(() => {
    const code = charInputs.join("").toUpperCase();
    setQuizCode(code);
    setIsCodeValid(code.length === 6);
  }, [charInputs]);

  // Handle input focus movement for code entry
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // For paste events, distribute characters
      const chars = value.slice(0, 6).split("");
      const newInputs = [...charInputs];
      
      chars.forEach((char, idx) => {
        if (index + idx < 6) {
          newInputs[index + idx] = char.toUpperCase();
        }
      });
      
      setCharInputs(newInputs);
      
      // Focus on the appropriate field
      const nextIndex = Math.min(index + chars.length, 5);
      document.getElementById(`char-input-${nextIndex}`)?.focus();
    } else {
      // For single character input
      const newInputs = [...charInputs];
      newInputs[index] = value.toUpperCase();
      setCharInputs(newInputs);
      
      // Focus next input if we entered a character
      if (value && index < 5) {
        document.getElementById(`char-input-${index + 1}`)?.focus();
      }
    }
  };

  // Handle backspace key
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !charInputs[index] && index > 0) {
      // Move to previous input when pressing backspace on empty field
      const prevInput = document.getElementById(`char-input-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        // Optionally clear the previous input
        const newInputs = [...charInputs];
        newInputs[index - 1] = "";
        setCharInputs(newInputs);
      }
    }
  };

  const handleQuizCodeSubmit = async () => {
    if (!quizCode.trim() || quizCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-character quiz code",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Check if quiz exists and is open
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, is_open')
        .eq('quiz_code', quizCode.trim())
        .single();

      if (error || !data) {
        toast({
          title: "Quiz Not Found",
          description: "Please check the code and try again",
          variant: "destructive",
        });
        return;
      }

      if (!data.is_open) {
        toast({
          title: "Quiz Closed",
          description: "This quiz is currently not accepting participants",
          variant: "destructive",
        });
        return;
      }

      // Navigate to quiz gate
      navigate(`/q/${data.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find quiz. Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-to-b from-background to-secondary/20">
      {/* Header - show admin button only if user is authenticated */}
      <Navbar showAdmin={!!user} transparent={true} showSignIn={true} />

      {/* Hero Section with Code Entry */}
      <section className="pt-16 md:pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left md:pr-8">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Join a <span className="text-primary">Quiz</span> in Seconds
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8">
                Enter your 6-character code below to join a quiz. No account required.
              </p>
              
              <div className="flex flex-col gap-6 mb-8">
                {/* Code entry boxes */}
                <div className="flex justify-between gap-2">
                  {charInputs.map((char, index) => (
                    <Input
                      key={index}
                      id={`char-input-${index}`}
                      className="h-16 w-12 text-center text-2xl font-bold p-0 border-2 focus:border-primary"
                      maxLength={index === 0 ? 6 : 1} // Allow pasting full code in first input
                      value={char}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      autoComplete="off"
                      autoCapitalize="characters"
                    />
                  ))}
                </div>
                
                <Button 
                  onClick={handleQuizCodeSubmit} 
                  disabled={isSearching || !isCodeValid}
                  size="lg" 
                  className="w-full text-lg"
                >
                  {isSearching ? (
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                  ) : (
                    <Play className="w-5 h-5 mr-3" />
                  )}
                  Start Quiz
                </Button>
              </div>
            </div>
            
            {/* Right side animation/illustration */}
            <div className="relative hidden md:block">
              <div className="bg-primary/10 absolute inset-0 rounded-3xl -rotate-6 transform"></div>
              <Card className="relative p-6 shadow-xl border-2 rounded-2xl overflow-hidden">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-2xl">Pop Quiz</CardTitle>
                  <CardDescription>Geography Trivia</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <p className="font-medium">What is the capital of Australia?</p>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <div className="bg-primary/20 text-primary font-medium p-2 rounded-md border border-primary/40">Sydney</div>
                      <div className="bg-green-500/20 text-green-700 font-medium p-2 rounded-md border border-green-500/40">Canberra ✓</div>
                      <div className="bg-primary/20 text-primary font-medium p-2 rounded-md border border-primary/40">Melbourne</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Question 3/10</span>
                    <span>15 seconds left</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/30 rounded-full blur-3xl opacity-30"></div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 relative">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How SwiftQuiz Works</h2>
            <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background/95 backdrop-blur border-2 hover:border-primary/30 transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-primary"></div>
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenLine className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl text-center">Create Quiz</CardTitle>
                <CardDescription className="text-center">
                  Design your MCQ quiz with custom questions, time limits, and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-center text-muted-foreground">
                Easily build quizzes for classrooms, training, or fun competitions
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-2 hover:border-primary/30 transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-green-500"></div>
              <CardHeader>
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-green-500" />
                </div>
                <CardTitle className="text-xl text-center">Share Code</CardTitle>
                <CardDescription className="text-center">
                  Distribute your unique 6-letter code to participants
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-center text-muted-foreground">
                No accounts needed - just enter the code and start playing
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-2 hover:border-primary/30 transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-amber-500"></div>
              <CardHeader>
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-amber-500" />
                </div>
                <CardTitle className="text-xl text-center">View Results</CardTitle>
                <CardDescription className="text-center">
                  Track performance with real-time leaderboards
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-center text-muted-foreground">
                See who answered correctly and fastest for each question
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5"></div>
      </section>

      {/* Features + Leaderboard Preview */}
      <section className="py-16 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-bold mb-6">Perfect for Any Occasion</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">Timed Challenges</h4>
                      <p className="text-muted-foreground">Set time limits per question to create excitement and challenge participants</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">Live Rankings</h4>
                      <p className="text-muted-foreground">Participants can see real-time leaderboards showing top performers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">Simple Participation</h4>
                      <p className="text-muted-foreground">Just enter your name and a quiz code to start - no accounts required</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {user ? (
                <Button asChild size="lg">
                  <Link to="/admin">
                    Create Your Quiz <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link to="/signin">
                    Sign In to Create Quizzes <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="relative">
              <div className="bg-primary/5 absolute inset-0 rounded-3xl rotate-3 transform"></div>
              <Card className="bg-background/95 backdrop-blur border-2 relative overflow-hidden">
                <CardHeader className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Live Leaderboard</CardTitle>
                    <div className="bg-green-500/20 text-green-700 text-xs px-2 py-1 rounded-full border border-green-500/20">
                      Live Results
                    </div>
                  </div>
                  <CardDescription>Geography Quiz • 10 Questions</CardDescription>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-500/10 to-amber-500/5 rounded-lg border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <div className="text-amber-500 text-lg font-bold">1</div>
                        <div>
                          <div className="font-medium">Sarah Johnson</div>
                          <div className="text-xs text-muted-foreground">9/10 correct</div>
                        </div>
                      </div>
                      <div className="text-amber-600 font-medium">2:12</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-500/10 to-gray-500/5 rounded-lg border border-gray-500/20">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-500 text-lg font-bold">2</div>
                        <div>
                          <div className="font-medium">Michael Chen</div>
                          <div className="text-xs text-muted-foreground">8/10 correct</div>
                        </div>
                      </div>
                      <div className="text-gray-600 font-medium">2:35</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
                      <div className="flex items-center gap-3">
                        <div className="text-orange-500 text-lg font-bold">3</div>
                        <div>
                          <div className="font-medium">Aisha Patel</div>
                          <div className="text-xs text-muted-foreground">8/10 correct</div>
                        </div>
                      </div>
                      <div className="text-orange-600 font-medium">2:44</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground text-lg font-bold">4</div>
                        <div>
                          <div className="font-medium">Robert Williams</div>
                          <div className="text-xs text-muted-foreground">7/10 correct</div>
                        </div>
                      </div>
                      <div className="text-muted-foreground font-medium">3:01</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground text-lg font-bold">5</div>
                        <div>
                          <div className="font-medium">Sophia Lopez</div>
                          <div className="text-xs text-muted-foreground">7/10 correct</div>
                        </div>
                      </div>
                      <div className="text-muted-foreground font-medium">3:15</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 px-4 bg-primary/10">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Quiz?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Enter your quiz code at the top of this page or create your own quizzes to share
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => {
                document.getElementById('char-input-0')?.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Enter Quiz Code
            </Button>
            {!user && (
              <Button asChild variant="outline" size="lg">
                <Link to="/signin">
                  Sign In to Create Quizzes
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-background">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-2">
                <span className="text-primary-foreground font-bold text-sm">SQ</span>
              </div>
              <h2 className="text-lg font-bold">
                <span className="text-primary">Swift</span>Quiz
              </h2>
            </div>
            
            <div className="text-center md:text-right text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} SwiftQuiz. Built with ❤️ for educators and learners.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;