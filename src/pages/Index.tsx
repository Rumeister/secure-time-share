
import { useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import { performPeriodicCacheCleanup, cleanupExpiredMessages } from "@/lib/storage";

const Index = () => {
  useEffect(() => {
    // Run cache cleanup on page load, but don't clear valid messages
    performPeriodicCacheCleanup();
    
    // Also run the basic cleanup for expired messages
    cleanupExpiredMessages();
  }, []);

  return (
    <Layout>
      <HeroSection />
      <FeatureSection />
    </Layout>
  );
};

export default Index;
