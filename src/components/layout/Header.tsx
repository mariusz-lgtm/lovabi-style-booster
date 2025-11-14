import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Shield, Menu, X } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import CreditsDisplay from "@/components/layout/CreditsDisplay";

const Header = () => {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setMobileMenuOpen(false);
      navigate('/');
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold font-heading text-primary">Lovabi</h1>
          </Link>
          
          <nav className="flex items-center space-x-4 md:space-x-8">
            {user && (
              <>
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

                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                    <SheetHeader>
                      <SheetTitle className="text-left">Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col space-y-6 mt-8">
                      <div className="flex flex-col space-y-1 pb-4 border-b border-border">
                        <CreditsDisplay />
                      </div>
                      
                      <nav className="flex flex-col space-y-4">
                        <button
                          onClick={() => handleNavClick('/enhance')}
                          className="text-left text-base font-medium text-foreground-secondary hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted touch-manipulation"
                        >
                          Photo Enhancer
                        </button>
                        <button
                          onClick={() => handleNavClick('/listing')}
                          className="text-left text-base font-medium text-foreground-secondary hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted touch-manipulation"
                        >
                          Listing Generator
                        </button>
                        <button
                          onClick={() => handleNavClick('/models')}
                          className="text-left text-base font-medium text-foreground-secondary hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted touch-manipulation"
                        >
                          My Models
                        </button>
                        <button
                          onClick={() => handleNavClick('/history')}
                          className="text-left text-base font-medium text-foreground-secondary hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted touch-manipulation"
                        >
                          History
                        </button>
                      </nav>

                      <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                        {isAdmin && (
                          <button
                            onClick={() => handleNavClick('/admin')}
                            className="flex items-center text-left text-base font-medium text-foreground-secondary hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted touch-manipulation"
                          >
                            <Shield className="mr-3 h-5 w-5" />
                            Admin Panel
                          </button>
                        )}
                        <button
                          onClick={() => handleNavClick('/settings')}
                          className="flex items-center text-left text-base font-medium text-foreground-secondary hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted touch-manipulation"
                        >
                          <Settings className="mr-3 h-5 w-5" />
                          Settings
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center text-left text-base font-medium text-foreground-secondary hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted touch-manipulation"
                        >
                          <LogOut className="mr-3 h-5 w-5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
            
            {user ? (
              <>
                <div className="hidden md:block">
                  <CreditsDisplay />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
