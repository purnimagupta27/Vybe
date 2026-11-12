import Hero from "../components/Hero";
import ClosingCta from "../components/landing/ClosingCta";
import Footer from "../components/landing/Footer";
import HowItWorks from "../components/landing/HowItWorks";
import WhyMusic from "../components/landing/WhyMusic";

/**
 * Public landing page combining the ambient hero with editorial product sections.
 */
export default function Landing() {
  return (
    <main>
      <Hero />
      <WhyMusic />
      <HowItWorks />
      <ClosingCta />
      <Footer />
    </main>
  );
}
