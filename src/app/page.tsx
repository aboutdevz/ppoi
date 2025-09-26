import {
  LandingHero,
  LandingFeatures,
  LandingShowcase,
  LandingCTA,
} from "@/components/landing/hero-sections";
import { PoiEffects } from "@/components/landing/poi-effects";

export default function Home() {
  return (
    <>
      <PoiEffects />
      <LandingHero />
      <LandingFeatures />
      <LandingShowcase />
      <LandingCTA />
    </>
  );
}
