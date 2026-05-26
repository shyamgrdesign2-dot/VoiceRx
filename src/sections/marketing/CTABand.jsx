import Link from "next/link";
import {
  Section,
  SectionHeading,
  GradientSpan,
  SectionLede,
  ScrollReveal,
  AnimatedGrid,
} from "@/src/components/marketing";

// CTABand — full-bleed CTA section using the TP Blue Depth gradient as
// the section background and the AnimatedGrid as an atmospheric layer
// (low opacity, behind the content). Drop in at the bottom of any
// subpage before the footer.

export default function CTABand({
  eyebrow = "Ready when you are",
  heading = "Bring AI into your consult room.",
  highlight = "today.",
  lede = "A 20-minute call is enough to see whether TatvaPractice fits your workflow. No setup, no commitment.",
  ctaLabel = "Book a demo",
  ctaHref = "#contact",
  secondaryLabel = "Talk to sales",
  secondaryHref = "#contact",
}) {
  return (
    <section className="relative w-full overflow-hidden bg-tp-blue-depth">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0.45 }}
      >
        <AnimatedGrid
          className="animated-grid-svg animated-grid-svg-on-dark"
          preserveAspectRatio="xMidYMid slice"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(80% 60% at 50% 50%, rgba(22, 21, 88, 0) 0%, rgba(22, 21, 88, 0.55) 70%, rgba(22, 21, 88, 0.85) 100%)",
        }}
      />

      <div
        className="relative mx-auto flex flex-col items-center gap-6 text-center"
        style={{
          width: "var(--section-w)",
          maxWidth: "var(--section-w)",
          paddingTop: "clamp(72px, 7vw, 112px)",
          paddingBottom: "clamp(72px, 7vw, 112px)",
          color: "#fff",
        }}
      >
        <ScrollReveal variant="fade-up" once>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]"
            style={{
              fontFamily: "var(--font-sans)",
              color: "rgba(255,255,255,0.92)",
              backgroundColor: "rgba(255, 255, 255, 0.10)",
              borderColor: "rgba(255, 255, 255, 0.20)",
            }}
          >
            {eyebrow}
          </span>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={80} once>
          <SectionHeading tone="light">
            {heading}{" "}
            <GradientSpan variant="white">{highlight}</GradientSpan>
          </SectionHeading>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={160} once>
          <SectionLede tone="light">{lede}</SectionLede>
        </ScrollReveal>

        <ScrollReveal
          variant="fade-up"
          delay={240}
          once
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href={ctaHref}
            className="cta-shimmer inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--tp-blue-900)",
              backgroundImage:
                "linear-gradient(135deg, #ffffff 0%, #EEEEFF 100%)",
            }}
          >
            {ctaLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="cta-outline inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.40)",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
            }}
          >
            {secondaryLabel}
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
