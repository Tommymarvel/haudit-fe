import { inter, manrope } from './fonts';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { ClientLogos } from './sections/ClientLogos';
import { SolutionIntro } from './sections/SolutionIntro';
import { Features } from './sections/Features';
import { StatsBand } from './sections/StatsBand';
import { Roles } from './sections/Roles';
import { BuiltByPros } from './sections/BuiltByPros';
import { StepsSection } from './sections/StepsSection';
import { Pricing } from './sections/Pricing';
import { Faq } from './sections/Faq';
import { Footer } from './sections/Footer';

export function LandingPage() {
  return (
    <div
      className={`${inter.variable} ${manrope.variable} bg-[#f4f4f4] font-[family-name:var(--font-landing-inter)]`}
    >
      <Header />
      <Hero />
      <ClientLogos />
      <SolutionIntro />
      <Features />
      <StatsBand />
      <Roles />
      <BuiltByPros />
      <StepsSection />
      <Pricing />
      <Faq />
      <Footer />
    </div>
  );
}
