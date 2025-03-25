
import { useEffect } from "react";
import ViewMessage from "@/components/ViewMessage";
import Layout from "@/components/Layout";
import { cleanupExpiredMessages, performPeriodicCacheCleanup, clearMessageCache } from "@/lib/storage";
import { toast } from "sonner";

const View = () => {
  useEffect(() => {
    console.log("View page loaded, initializing storage and running cleanup");
    
    // Ensure secureMessages exists in localStorage (BEFORE any cleanup)
    if (!localStorage.getItem('secureMessages')) {
      localStorage.setItem('secureMessages', '[]');
      console.log("Initialized empty secureMessages array");
    } else {
      try {
        const messagesStr = localStorage.getItem('secureMessages');
        if (messagesStr) {
          const messages = JSON.parse(messagesStr);
          if (Array.isArray(messages)) {
            console.log(`Found ${messages.length} messages in localStorage`);
          } else {
            console.warn("secureMessages is not an array, resetting");
            localStorage.setItem('secureMessages', '[]');
          }
        }
      } catch (e) {
        console.error("Error checking secureMessages:", e);
        localStorage.setItem('secureMessages', '[]');
      }
    }
    
    // Run more comprehensive cache cleanup on page load
    performPeriodicCacheCleanup();
    
    // Also run the basic cleanup for expired messages
    cleanupExpiredMessages();
    
    // Force a fresh page reload if requested via query param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clear-cache') === 'true') {
      const clearedItems = clearMessageCache(true); // Preserve valid messages
      toast.success(`Cache cleared (${clearedItems} expired items removed)`);
    }
    
    // Double-check storage consistency to prevent empty arrays
    setTimeout(() => {
      // Verify storage after all cleanup operations
      try {
        const messagesStr = localStorage.getItem('secureMessages');
        console.log(`Storage after initialization: ${messagesStr ? 'contains data' : 'empty'}, length: ${messagesStr?.length || 0}`);
      } catch (e) {
        console.error("Error verifying storage:", e);
      }
    }, 100);
  }, []);

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl animate-fade-in">
              Butterfly Message
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
