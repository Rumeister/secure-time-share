
import { useEffect } from "react";
import ViewMessage from "@/components/ViewMessage";
import Layout from "@/components/Layout";
import { cleanupExpiredMessages } from "@/lib/storage";

const View = () => {
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
              Secure Message
            </h1>
            <p className="mt-4 text-md text-muted-foreground animate-fade-in [animation-delay:100ms]">
              This message is encrypted and will be available only for a limited time.
            </p>
          </div>
          
          <ViewMessage />
        </div>
      </section>
    </Layout>
  );
};

export default View;
