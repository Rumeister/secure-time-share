
import Layout from "@/components/Layout";
import MessageForm from "@/components/MessageForm";
import EncryptionTester from "@/components/EncryptionTester";
import { useEffect, useState } from "react";
import { cleanupExpiredMessages } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

const Create = () => {
  const [showTester, setShowTester] = useState(false);
  
  useEffect(() => {
    // Clean up any expired messages on page load
    cleanupExpiredMessages();
  }, []);

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl animate-fade-in">
              Create a secure, time-limited message
            </h1>
            <p className="mt-4 text-md text-muted-foreground animate-fade-in [animation-delay:100ms]">
              Your message will be encrypted right in your browser before being stored. 
              Only someone with the share link can decrypt and read it.
            </p>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTester(!showTester)}
                className="flex items-center text-xs"
              >
                <Bug className="mr-1 h-3.5 w-3.5" />
                {showTester ? "Hide Encryption Tester" : "Debug Encryption"}
              </Button>
            </div>
          </div>
          
          {showTester && <EncryptionTester />}
          
          <MessageForm />
        </div>
      </section>
    </Layout>
  );
};

export default Create;
