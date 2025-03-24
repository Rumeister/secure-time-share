
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LockKeyhole, Clock, Shield } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-12 md:py-20 lg:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[120%] max-w-none">
          <div className="h-full w-full bg-gradient-to-br from-primary/5 via-blue-50/10 to-background rounded-full blur-3xl"></div>
        </div>
      </div>
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary-foreground mb-6 animate-fade-in">
            <Shield className="mr-1 h-3.5 w-3.5" />
            <span className="text-primary">Client-side Encryption</span>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/lovable-uploads/c3bf18e8-78c5-49f1-9604-51f7b2c3dca8.png" alt="Butterfly logo" className="object-contain" />
              <AvatarFallback className="bg-primary/10">
                <LockKeyhole className="h-10 w-10 text-primary" />
              </AvatarFallback>
            </Avatar>
          </div>
          
          <h1 className="max-w-4xl text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-slide-up [animation-delay:100ms]">
            Share sensitive information with 
            <span className="text-primary"> total privacy</span>
          </h1>
          
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground animate-slide-up [animation-delay:200ms]">
            Secure, ephemeral, and private. Share sensitive information that 
            automatically expires after being viewed or after a set time. 
            Your data never leaves your device unencrypted.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up [animation-delay:300ms]">
            <Button asChild size="lg" className="h-12 px-6">
              <Link to="/create">
                <LockKeyhole className="mr-2 h-4 w-4" />
                Create Secure Message
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6">
              <a href="#features">
                <span>Learn More</span>
              </a>
            </Button>
          </div>
          
          <div className="mt-16 md:mt-24 grid grid-cols-1 gap-8 sm:grid-cols-3 animate-fade-in [animation-delay:500ms]">
            <div className="flex flex-col items-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <LockKeyhole className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-medium">End-to-End Encryption</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Your data is encrypted in your browser before being shared
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-medium">Time-Limited Access</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Messages expire automatically after viewing or set time
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-medium">Zero Knowledge</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                We never see your unencrypted data - total privacy
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
