import {
  Section,
  SectionHeading,
  GradientSpan,
  Eyebrow,
  SectionLede,
  ScrollReveal,
} from "@/src/components/marketing";

// FeatureGrid — second below-fold section. Demonstrates how a
// content-heavy section composes without the AnimatedGrid bg — just the
// section wash + a 2/3-up grid of glass cards. Use this pattern for any
// "list of capabilities" section on any subpage.

const FEATURES = [
  {
    eyebrow: "Appointments",
    title: "Queue that thinks ahead",
    body: "See vitals, last visit summary and pending follow-ups before the patient walks in. Skip the chart-hunting.",
  },
  {
    eyebrow: "Voice",
    title: "Speak it, prescribe it",
    body: "Dictate naturally; VoiceRx structures the Rx, checks interactions, and waits for your sign-off before send.",
  },
  {
    eyebrow: "Continuity",
    title: "Follow-ups don't fall through",
    body: "Automatic follow-up scheduling, recall reminders, and a dashboard that surfaces patients overdue for a review.",
  },
  {
    eyebrow: "Snap",
    title: "Paper to formulary in seconds",
    body: "Capture an outside prescription with the camera; SnapRx digitises it into your formulary with full audit trail.",
  },
  {
    eyebrow: "Print",
    title: "Your letterhead, lossless",
    body: "Print-preview that mirrors what the patient receives — letterhead, signature, dispensing notes, all in one pass.",
  },
  {
    eyebrow: "Privacy",
    title: "On your terms",
    body: "Encrypted at rest, in transit, and during inference. Patient data never leaves your jurisdiction without consent.",
  },
];

export default function FeatureGrid() {
  return (
    <Section bg="blue" padY="normal" intensity={0.9}>
      <div className="flex flex-col items-center gap-6">
        <ScrollReveal variant="fade-up" once>
          <Eyebrow>Built around the workflow</Eyebrow>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={80} once>
          <SectionHeading>
            Every capability,{" "}
            <GradientSpan variant="violet">in one surface.</GradientSpan>
          </SectionHeading>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={160} once>
          <SectionLede>
            Each capability composes with the others. Appointments feed the
            visit, the visit feeds the prescription, the prescription feeds
            follow-up — no tab-switching, no rekeying.
          </SectionLede>
        </ScrollReveal>
      </div>

      <div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        style={{ marginTop: "clamp(40px, 4vw, 64px)" }}
      >
        {FEATURES.map((f, i) => (
          <ScrollReveal
            key={f.eyebrow}
            variant="fade-up"
            delay={80 * (i % 3)}
            once
          >
            <article
              className="glass-surface flex h-full flex-col gap-3 p-7"
              style={{ borderRadius: 18, minHeight: 220 }}
            >
              <span
                className="inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--tp-violet-700)",
                  backgroundColor: "rgba(138, 77, 187, 0.08)",
                  borderColor: "rgba(138, 77, 187, 0.18)",
                }}
              >
                {f.eyebrow}
              </span>
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
                {f.title}
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
                {f.body}
              </p>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
