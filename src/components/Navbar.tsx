import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Trophy, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";

interface NavbarProps {
  showAdmin?: boolean;
  showLeaderboard?: boolean;
  quizId?: string;
  transparent?: boolean;
}

const Navbar = ({ showAdmin = true, showLeaderboard = false, quizId, transparent = false }: NavbarProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className={`border-b ${transparent ? 'bg-card/50 backdrop-blur' : 'bg-card'}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">SQ</span>
            </div>
            <h1 className="text-xl font-bold">
              <span className="text-primary">Swift</span>Quiz
            </h1>
          </Link>
          
          <div className="flex items-center gap-3">
            {showLeaderboard && quizId && (
              <Button asChild variant={location.pathname.includes('leaderboard') ? 'default' : 'outline'}>
                <Link to={`/q/${quizId}/leaderboard`}>
                  <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                </Link>
              </Button>
            )}
            
            {/* Only show Home button on admin pages */}
            {isAdminRoute && (
              <Button asChild variant="ghost" size="icon">
                <Link to="/" title="Home">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
            )}
            
            {/* Show Admin button only if user is authenticated or on admin pages already */}
            {showAdmin && (user || isAdminRoute) && (
              <Button asChild variant="outline" className="ml-2">
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" /> Admin
                </Link>
              </Button>
            )}
            
            {/* Show sign out button when user is logged in */}
            {user && (
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
