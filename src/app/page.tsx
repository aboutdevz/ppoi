import {
  LandingHero,
  LandingFeatures,
  LandingCTA,
} from "@/components/landing/hero-sections";

export default function Home() {
  return (
    <>
      <LandingHero />
      <LandingFeatures />
      <LandingCTA />
    </>
  );
}
