import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Trophy, Clock, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/useAuth";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header - show admin button only if user is authenticated */}
      <Navbar showAdmin={!!user} transparent={true} />

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Create & Share
            <span className="text-primary"> MCQ Quizzes</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Build engaging multiple-choice questionnaires, share them instantly, and watch participants compete on real-time leaderboards.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              {user ? (
                <Link to="/admin">
                  Admin Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <Link to="/signin">
                  Admin Sign In <Lock className="ml-2 w-5 h-5" />
                </Link>
              )}
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Enter Quiz Code
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Create Quiz</CardTitle>
                <CardDescription>
                  Build your MCQ quiz with multiple-choice questions, set time limits, and customize settings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Share Link</CardTitle>
                <CardDescription>
                  Get a shareable link and invite participants. No signup required - just enter a name and start!
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Live Leaderboard</CardTitle>
                <CardDescription>
                  Real-time rankings based on correct answers and speed. Top 3 winners displayed instantly!
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">Perfect for Any Occasion</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Timed Questions</h4>
                    <p className="text-muted-foreground">Set time limits per question to add excitement and challenge</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Trophy className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Smart Scoring</h4>
                    <p className="text-muted-foreground">Ranks by most correct answers, with time as the tiebreaker</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">No Registration</h4>
                    <p className="text-muted-foreground">Participants just need a name to start - no complex signup process</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-secondary/50 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="font-semibold">🥇 Alice Johnson</div>
                  <div className="text-sm text-muted-foreground">8/10 correct • 2:34</div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="font-semibold">🥈 Bob Smith</div>
                  <div className="text-sm text-muted-foreground">8/10 correct • 2:41</div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="font-semibold">🥉 Carol Davis</div>
                  <div className="text-sm text-muted-foreground">7/10 correct • 2:15</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 SwiftQuiz. Built with ❤️ for educators and learners.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;