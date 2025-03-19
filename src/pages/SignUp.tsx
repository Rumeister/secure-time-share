
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignUp as ClerkSignUp, useUser } from "@clerk/clerk-react";
import Layout from "@/components/Layout";

const SignUp = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="mt-2 text-muted-foreground">
            Create an account to manage your secure messages
          </p>
        </div>
        
        <div className="glass-card p-6 backdrop-blur-lg bg-white/10 border border-white/10 rounded-lg shadow-xl">
          <ClerkSignUp 
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none w-full",
                headerTitle: "text-xl font-semibold text-center",
                headerSubtitle: "text-sm text-center text-muted-foreground",
                socialButtonsBlockButton: "rounded-md flex items-center justify-center",
                socialButtonsIconButton: "rounded-md",
                dividerContainer: "my-4",
                dividerText: "text-muted-foreground",
                formFieldLabel: "text-sm font-medium",
                formFieldInput: "rounded-md px-3 py-2 bg-white/20 border border-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 mt-2 w-full",
                footerActionLink: "text-primary hover:text-primary/90",
              }
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SignUp;
