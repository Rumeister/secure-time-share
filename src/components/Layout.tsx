
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, Shield, Clock, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header 
        className={`sticky top-0 z-50 transition-all-300 ${
          scrolled 
            ? "bg-white/80 backdrop-blur-md shadow-sm" 
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-2 transition-all-200 hover:opacity-80"
              >
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-lg font-semibold tracking-tight">SecureShare</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className="text-sm font-medium text-muted-foreground transition-all-200 hover:text-foreground"
              >
                Home
              </Link>
              <Link 
                to="/create" 
                className="text-sm font-medium text-muted-foreground transition-all-200 hover:text-foreground"
              >
                Create
              </Link>
              <Button asChild size="sm" className="ml-4">
                <Link to="/create">
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  Share Securely
                </Link>
              </Button>
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-fade-in">
            <div className="px-4 pt-2 pb-3 space-y-1 bg-white/90 backdrop-blur-md border-t">
              <Link 
                to="/" 
                className="block px-3 py-2 text-base font-medium text-foreground rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/create" 
                className="block px-3 py-2 text-base font-medium text-foreground rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create
              </Link>
              <div className="pt-4 pb-2">
                <Button asChild className="w-full" size="sm">
                  <Link to="/create" onClick={() => setMobileMenuOpen(false)}>
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    Share Securely
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-gray-100 bg-white/30 py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-2 md:items-start">
              <Link to="/" className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">SecureShare</span>
              </Link>
              <p className="text-center text-xs text-muted-foreground md:text-left">
                Client-side encryption. Your data never leaves your device.
              </p>
            </div>
            <div className="flex gap-4">
              <Link 
                to="/create" 
                className="text-xs text-muted-foreground transition-all-200 hover:text-foreground"
              >
                Create
              </Link>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} SecureShare. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
