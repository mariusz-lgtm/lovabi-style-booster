import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold font-heading text-primary">Lovabi</h1>
          </Link>
          
          <nav className="flex items-center space-x-8">
            {user && (
              <div className="hidden md:flex items-center space-x-8">
                <Link 
                  to="/enhance" 
                  className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Photo Enhancer
                </Link>
                <Link 
                  to="/listing" 
                  className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Listing Generator
                </Link>
                <Link 
                  to="/models" 
                  className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                >
                  My Models
                </Link>
                <Link 
                  to="/history" 
                  className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                >
                  History
                </Link>
              </div>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
