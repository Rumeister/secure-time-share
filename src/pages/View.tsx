
import { useEffect } from "react";
import ViewMessage from "@/components/ViewMessage";
import Layout from "@/components/Layout";
import { 
  cleanupExpiredMessages, 
  performPeriodicCacheCleanup, 
  clearMessageCache, 
  forceReloadStorage,
  getAllMessages,
  initializeStorage
} from "@/lib/storage"; // This import now uses the refactored module

import { toast } from "sonner";

const View = () => {
  useEffect(() => {
    console.log("View page loaded, initializing storage and running cleanup");
    
    // First initialize storage to ensure it exists
    const initialized = initializeStorage();
    if (!initialized) {
      console.warn("Storage initialization failed, retrying...");
      // Try again with forced cleanup
      setTimeout(() => {
        initializeStorage();
      }, 100);
    }
    
    // Check messages after initialization
    const messages = getAllMessages();
    if (messages.length === 0) {
      console.log("Found 0 messages in localStorage");
    } else {
      console.log(`Found ${messages.length} messages in localStorage`);
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
        
        // If there are URL params for a message but no messages in storage, try to reload
        const urlParams = new URL(window.location.href);
        const pathSegments = urlParams.pathname.split('/');
        if (pathSegments.length > 2 && pathSegments[1] === 'view' && messagesStr === '[]') {
          console.log("Detected message ID in URL but no messages in storage, trying to reload storage");
          forceReloadStorage();
        }
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
