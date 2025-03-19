
import Layout from "@/components/Layout";
import MessageForm from "@/components/MessageForm";
import { useEffect } from "react";
import { cleanupExpiredMessages } from "@/lib/storage";

const Create = () => {
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
          </div>
          
          <MessageForm />
        </div>
      </section>
    </Layout>
  );
};

export default Create;
