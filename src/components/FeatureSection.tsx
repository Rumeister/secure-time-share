
import { LockKeyhole, Clock, Shield, Eye, Key, RefreshCw } from "lucide-react";

const FeatureSection = () => {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center mb-12 md:mb-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl animate-fade-in">
            Secure by design, private by default
          </h2>
          <p className="mt-4 text-lg text-muted-foreground animate-fade-in [animation-delay:100ms]">
            Our platform is built from the ground up with security and privacy as the foundation,
            not an afterthought.
          </p>
        </div>
        
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="glass-card p-6 animate-scale-in [animation-delay:100ms]">
            <div className="mb-4 rounded-full bg-primary/10 p-2.5 w-10 h-10 flex items-center justify-center">
              <LockKeyhole className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Client-side Encryption</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              All encryption happens in your browser using AES-256, ensuring your data is secure before it ever leaves your device.
            </p>
          </div>
          
          <div className="glass-card p-6 animate-scale-in [animation-delay:200ms]">
            <div className="mb-4 rounded-full bg-primary/10 p-2.5 w-10 h-10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Self-destructing Messages</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Set expiration times or view limits for your shared information, after which it's automatically and permanently deleted.
            </p>
          </div>
          
          <div className="glass-card p-6 animate-scale-in [animation-delay:300ms]">
            <div className="mb-4 rounded-full bg-primary/10 p-2.5 w-10 h-10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">View Once Option</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create messages that automatically delete after being viewed a single time for maximum security.
            </p>
          </div>
          
          <div className="glass-card p-6 animate-scale-in [animation-delay:400ms]">
            <div className="mb-4 rounded-full bg-primary/10 p-2.5 w-10 h-10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No Account Required</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the service without creating an account or providing any personal information for complete anonymity.
            </p>
          </div>
          
          <div className="glass-card p-6 animate-scale-in [animation-delay:500ms]">
            <div className="mb-4 rounded-full bg-primary/10 p-2.5 w-10 h-10 flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Zero Knowledge</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We never have access to your decryption keys or plaintext data, ensuring complete privacy for your sensitive information.
            </p>
          </div>
          
          <div className="glass-card p-6 animate-scale-in [animation-delay:600ms]">
            <div className="mb-4 rounded-full bg-primary/10 p-2.5 w-10 h-10 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Open Source</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Our code is transparent and open for review, ensuring there are no backdoors or security vulnerabilities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
