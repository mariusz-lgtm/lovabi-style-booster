import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold font-heading text-primary">Lovabi</h1>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
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
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
