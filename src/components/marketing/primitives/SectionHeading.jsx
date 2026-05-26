// SectionHeading — the canonical h2 for marketing sections.
//
// Responsive clamp() type scale so we don't need breakpoints. Use
// <GradientSpan> to wrap one or two accent words in the heading.

export default function SectionHeading({
  children,
  tone = "dark",
  align = "center",
  as: Tag = "h2",
}) {
  return (
    <Tag
      className={[
        "[text-wrap:balance]",
        align === "center" ? "text-center" : "text-left",
        tone === "dark" ? "text-[color:var(--tp-slate-900)]" : "text-white",
      ].join(" ")}
      style={{
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: "clamp(28px, 4.2vw, 48px)",
        lineHeight: 1.12,
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {children}
    </Tag>
  );
}

// Inline gradient span — wrap one or two accent words inside a heading.
// Three brand variants mapped to canonical gradients.
export function GradientSpan({ children, variant = "violet" }) {
  const gradients = {
    violet: "linear-gradient(90deg, var(--tp-violet-700) 0%, var(--tp-blue-900) 100%)",
    blue: "linear-gradient(90deg, var(--tp-blue-500) 0%, var(--tp-blue-900) 100%)",
    ai: "linear-gradient(135deg, var(--ai-pink) 0%, var(--ai-violet) 55%, var(--ai-indigo) 100%)",
    white: "linear-gradient(98deg, #ffffff 0%, rgba(255,255,255,0.8) 100%)",
  };
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{ backgroundImage: gradients[variant] }}
    >
      {children}
    </span>
  );
}

// Eyebrow — small pill/label above a heading. Pairs with SectionHeading.
export function Eyebrow({ children, tone = "dark" }) {
  const styles =
    tone === "dark"
      ? {
          color: "var(--tp-violet-700)",
          backgroundColor: "rgba(138, 77, 187, 0.08)",
          borderColor: "rgba(138, 77, 187, 0.18)",
        }
      : {
          color: "rgba(255, 255, 255, 0.9)",
          backgroundColor: "rgba(255, 255, 255, 0.10)",
          borderColor: "rgba(255, 255, 255, 0.20)",
        };
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]"
      style={{
        fontFamily: "var(--font-sans)",
        ...styles,
      }}
    >
      {children}
    </span>
  );
}

// SectionLede — body paragraph that sits under a SectionHeading.
// Balanced wrap, comfortable measure, brand-neutral color.
export function SectionLede({ children, tone = "dark", align = "center" }) {
  return (
    <p
      className={[
        "[text-wrap:balance]",
        align === "center" ? "text-center mx-auto" : "text-left",
      ].join(" ")}
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "clamp(15px, 1.2vw, 18px)",
        lineHeight: 1.55,
        color:
          tone === "dark"
            ? "var(--tp-slate-600)"
            : "rgba(255, 255, 255, 0.78)",
        maxWidth: "62ch",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}
