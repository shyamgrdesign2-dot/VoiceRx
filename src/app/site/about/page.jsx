import {
  Section,
  SectionHeading,
  GradientSpan,
  Eyebrow,
  SectionLede,
  ScrollReveal,
} from "@/src/components/marketing";
import { CTABand } from "@/src/sections/marketing";

// /site/about — example subpage. Demonstrates the reusable subpage
// pattern: same shell (header + footer) is supplied by the /site layout,
// the page itself is just a sequence of <Section> components.
//
// Copy this file as a starting point for any future subpage. Swap the
// content, keep the structure.

export const metadata = {
  title: "About · TatvaPractice",
  description:
    "TatvaPractice is built by clinicians and engineers who shipped consults end-to-end before they shipped software.",
};

const PILLARS = [
  {
    label: "Clinician-first",
    body: "Every interaction is reviewed against the consult room before it ships. If it doesn't save the doctor a click, it doesn't ship.",
  },
  {
    label: "AI as collaborator",
    body: "AI drafts; clinicians approve. We never automate decisions that affect patients without an explicit sign-off in the loop.",
  },
  {
    label: "Privacy by default",
    body: "Patient data is encrypted at rest, in transit, and during inference. No model training on patient records — ever.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section bg="lavender" padY="hero" intensity={1.05}>
        <div className="flex flex-col items-center gap-6 text-center">
          <ScrollReveal variant="fade-up" once>
            <Eyebrow>About</Eyebrow>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={80} once>
            <SectionHeading as="h1">
              Built by clinicians.{" "}
              <GradientSpan variant="ai">For clinicians.</GradientSpan>
            </SectionHeading>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={160} once>
            <SectionLede>
              TatvaPractice was started by a team that ran consults
              end-to-end before they shipped software. We've felt the friction
              of the EMR. We're building the surface we wished we had.
            </SectionLede>
          </ScrollReveal>
        </div>
      </Section>

      <Section bg="blue" padY="normal" intensity={0.9}>
        <div className="flex flex-col items-center gap-6 text-center">
          <ScrollReveal variant="fade-up" once>
            <Eyebrow>What we believe</Eyebrow>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={80} once>
            <SectionHeading>
              Three pillars,{" "}
              <GradientSpan variant="violet">non-negotiable.</GradientSpan>
            </SectionHeading>
          </ScrollReveal>
        </div>

        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
          style={{ marginTop: "clamp(40px, 4vw, 64px)" }}
        >
          {PILLARS.map((p, i) => (
            <ScrollReveal
              key={p.label}
              variant="fade-up"
              delay={120 * i}
              once
            >
              <article
                className="glass-surface flex h-full flex-col gap-3 p-7"
                style={{ borderRadius: 18, minHeight: 200 }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--tp-blue-500) 0%, var(--tp-violet-700) 100%)",
                    color: "#fff",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: "0 6px 18px rgba(75, 74, 213, 0.32)",
                  }}
                >
                  {i + 1}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: 20,
                    lineHeight: 1.22,
                    letterSpacing: "-0.01em",
                    color: "var(--tp-slate-900)",
                    margin: 0,
                  }}
                >
                  {p.label}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    color: "var(--tp-slate-600)",
                    margin: 0,
                  }}
                >
                  {p.body}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      <CTABand
        eyebrow="Get in touch"
        heading="Want to talk to the team?"
        highlight="We're listening."
        lede="If you're a clinician with an opinion about how this should work, we want to hear it. No sales pitch on our end."
        ctaLabel="Email the team"
        secondaryLabel="See open roles"
      />
    </>
  );
}
