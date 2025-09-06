import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Trophy, Settings, LogOut, UserCircle, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface NavbarProps {
  showAdmin?: boolean;
  showLeaderboard?: boolean;
  quizId?: string;
  transparent?: boolean;
  showSignIn?: boolean;
}

const Navbar = ({ showAdmin = true, showLeaderboard = false, quizId, transparent = false, showSignIn = false }: NavbarProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  return (
    <header className={`border-b ${transparent ? 'bg-card/50 backdrop-blur sticky top-0 z-50' : 'bg-card'}`}>
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 sm:h-9 flex items-center justify-center">
              <img src="/logos/darkya-emblem.png" alt="Yashoda AI" className="h-7 sm:h-8" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold">
              <span className="text-primary">Yashoda</span> Quiz
            </h1>
          </Link>
          
          {/* Desktop Menu */}
          {!isMobile ? (
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
              
              {/* Show Sign In button if not logged in and showSignIn is true */}
              {showSignIn && !user && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/signin">
                    <UserCircle className="mr-2 h-4 w-4" /> Sign In
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
          ) : (
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMobile && mobileMenuOpen && (
          <div className="mt-2 py-2 sm:py-3 border-t flex flex-col gap-2 animate-in fade-in slide-in-from-top-5 duration-300">
            {showLeaderboard && quizId && (
              <Button 
                asChild 
                variant={location.pathname.includes('leaderboard') ? 'default' : 'outline'} 
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to={`/q/${quizId}/leaderboard`}>
                  <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                </Link>
              </Button>
            )}
            
            {isAdminRoute && (
              <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/" title="Home">
                  <Home className="h-5 w-5 mr-2" /> Home
                </Link>
              </Button>
            )}
            
            {showSignIn && !user && (
              <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/signin">
                  <UserCircle className="mr-2 h-4 w-4" /> Sign In
                </Link>
              </Button>
            )}
            
            {showAdmin && (user || isAdminRoute) && (
              <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" /> Admin
                </Link>
              </Button>
            )}
            
            {user && (
              <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="h-5 w-5 mr-2" /> Sign Out
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
