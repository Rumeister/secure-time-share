
import { useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import { performPeriodicCacheCleanup } from "@/lib/storage";

const Index = () => {
  useEffect(() => {
    // Run more comprehensive cache cleanup on page load
    performPeriodicCacheCleanup();
  }, []);

  return (
    <Layout>
      <HeroSection />
      <FeatureSection />
    </Layout>
  );
};

export default Index;
