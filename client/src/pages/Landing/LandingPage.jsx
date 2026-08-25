import Navbar from "../../components/landing/Navbar";
import HeroSection from "../../components/landing/HeroSection";
import StatsSection from "../../components/landing/StatsSection";
import FeaturesSection from "../../components/landing/FeaturesSection";
import ExperienceSection from "../../components/landing/ExperienceSection";
import HowItWorksSection from "../../components/landing/HowItWorksSection";
import TestimonialsSection from "../../components/landing/TestimonialsSection";
import CtaSection from "../../components/landing/CtaSection";
import Footer from "../../components/landing/Footer";

import "./LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />

      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ExperienceSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;