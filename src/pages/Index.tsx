
import { useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import { cleanupExpiredMessages } from "@/lib/storage";

const Index = () => {
  useEffect(() => {
    // Clean up any expired messages on page load
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
