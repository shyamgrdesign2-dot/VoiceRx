import { Hero, FeatureGrid, CTABand } from "@/src/sections/marketing";

// Landing page (/site). Composes the three example sections to show the
// full design system in motion. Add or reorder sections here as the
// landing copy evolves.

export default function SiteLandingPage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <CTABand />
    </>
  );
}
