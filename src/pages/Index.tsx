
import { useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import { performPeriodicCacheCleanup, cleanupExpiredMessages } from "@/lib/storage";

const Index = () => {
  useEffect(() => {
    // Initialize storage if needed and run cleanup
    console.log("Homepage loaded, initializing storage and running cleanup");
    
    // Run cache cleanup on page load, but only for expired messages
    performPeriodicCacheCleanup();
    
    // Also run the basic cleanup for expired messages
    cleanupExpiredMessages();
    
    // Ensure secureMessages exists in localStorage
    if (!localStorage.getItem('secureMessages')) {
      localStorage.setItem('secureMessages', '[]');
      console.log("Initialized empty secureMessages array");
    }
  }, []);

  return (
    <Layout>
      <HeroSection />
      <FeatureSection />
    </Layout>
  );
};

export default Index;
