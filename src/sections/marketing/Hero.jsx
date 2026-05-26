import Link from "next/link";
import {
  Section,
  SectionHeading,
  GradientSpan,
  Eyebrow,
  SectionLede,
  ScrollReveal,
  AnimatedGridCard,
} from "@/src/components/marketing";

// Hero — landing hero. Above-the-fold composition:
//
//   eyebrow → heading w/ gradient span → lede → dual CTA → cards
//
// The three cards at the bottom of the hero are AnimatedGridCards — each
// showcases one AI feature with the live grid backdrop. This is the
// "cards in the hero section at the top bar" the user wanted the
// AnimatedGrid wired into.

const FEATURES = [
  {
    eyebrow: "VoiceRx",
    title: "Speak. Sign. Send.",
    description:
      "Dictate the consult in plain language — VoiceRx structures the Rx, flags interactions, and prints in your house style.",
    tone: "depth",
  },
  {
    eyebrow: "SmartSync",
    title: "One source of truth",
    description:
      "Appointments, vitals, labs and history flow into the visit canvas automatically — no copy-paste, no missing fields.",
    tone: "violet",
  },
  {
    eyebrow: "SnapRx",
    title: "Capture in a snap",
    description:
      "Photograph an existing prescription and SnapRx digitises it into your formulary with allergy + dose checks.",
    tone: "ai",
  },
];

export default function Hero() {
  return (
    <Section bg="lavender" padY="hero" wide intensity={1.1}>
      <div className="flex flex-col items-center gap-6">
        <ScrollReveal variant="fade-up" once>
          <Eyebrow>AI-native clinical workspace</Eyebrow>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={80} once>
          <SectionHeading as="h1">
            Run your practice.{" "}
            <GradientSpan variant="ai">Let AI handle the rest.</GradientSpan>
          </SectionHeading>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={160} once>
          <SectionLede>
            TatvaPractice gives clinicians a single surface for appointments,
            voice-driven prescriptions, and visit continuity — built around
            how you actually work, not around the EMR.
          </SectionLede>
        </ScrollReveal>

        <ScrollReveal
          variant="fade-up"
          delay={240}
          once
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="#contact"
            className="cta-shimmer inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#fff",
              backgroundImage:
                "linear-gradient(135deg, var(--tp-blue-500) 0%, var(--tp-blue-900) 100%)",
            }}
          >
            Book a demo
          </Link>
          <Link
            href="#product"
            className="cta-outline inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--tp-blue-700)",
              borderColor: "rgba(75, 74, 213, 0.22)",
              backgroundColor: "rgba(255, 255, 255, 0.6)",
            }}
          >
            See how it works
          </Link>
        </ScrollReveal>
      </div>

      {/* Hero feature cards — three AnimatedGridCards, one per AI feature.
          These are the "cards in the hero section at the top bar" the
          user wanted the AnimatedGrid wired into. */}
      <div
        className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3"
        style={{ marginTop: "clamp(48px, 5vw, 80px)" }}
      >
        {FEATURES.map((f, i) => (
          <ScrollReveal
            key={f.eyebrow}
            variant="fade-up"
            delay={120 * i}
            once
          >
            <AnimatedGridCard
              tone={f.tone}
              eyebrow={f.eyebrow}
              title={f.title}
              description={f.description}
              cta={
                <Link
                  href={`#${f.eyebrow.toLowerCase()}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  Learn more <span aria-hidden>→</span>
                </Link>
              }
            />
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
