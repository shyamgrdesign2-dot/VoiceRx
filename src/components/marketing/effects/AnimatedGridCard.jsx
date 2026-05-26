import AnimatedGrid from "./AnimatedGrid";

// AnimatedGridCard — a feature card whose backdrop is a live AnimatedGrid.
//
// Use for hero/top-bar feature cards where motion in the bg adds energy.
// Two tones:
//   tone="depth" (default) — TP Blue Depth gradient + grid pulses on dark
//   tone="violet"          — TP Violet Depth gradient + grid pulses on dark
//   tone="ai"              — AI gradient + grid pulses on dark
//   tone="light"           — glass surface + faded grid for off-white sections
//
// Composition: relative parent clips overflow; AnimatedGrid is the
// absolutely-positioned backdrop ("slice" preserveAspectRatio fills the
// card and is clipped at the edges); content sits in a stacking context
// above with appropriate text contrast.

export default function AnimatedGridCard({
  tone = "depth",
  eyebrow,
  title,
  description,
  icon,
  cta,
  footer,
  className = "",
  style,
  children,
}) {
  const tones = {
    depth: {
      bg: "bg-tp-blue-depth",
      text: "text-white",
      muted: "rgba(255,255,255,0.78)",
      eyebrowTone: "light",
      gridClass: "animated-grid-svg animated-grid-svg-on-dark",
      gridOpacity: 1,
    },
    violet: {
      bg: "bg-tp-violet-depth",
      text: "text-white",
      muted: "rgba(255,255,255,0.78)",
      eyebrowTone: "light",
      gridClass: "animated-grid-svg animated-grid-svg-on-dark",
      gridOpacity: 1,
    },
    ai: {
      bg: "",
      text: "text-white",
      muted: "rgba(255,255,255,0.78)",
      eyebrowTone: "light",
      gridClass: "animated-grid-svg animated-grid-svg-on-dark",
      gridOpacity: 1,
      extraStyle: {
        backgroundImage:
          "linear-gradient(135deg, var(--ai-pink) 0%, var(--ai-violet) 55%, var(--ai-indigo) 100%)",
      },
    },
    light: {
      bg: "glass-surface",
      text: "text-[color:var(--tp-slate-900)]",
      muted: "var(--tp-slate-600)",
      eyebrowTone: "dark",
      gridClass: "animated-grid-svg",
      gridOpacity: 0.35,
    },
  };
  const t = tones[tone];

  return (
    <div
      className={[
        "relative overflow-hidden isolate lift-on-hover",
        t.bg,
        t.text,
        className,
      ].join(" ")}
      style={{
        borderRadius: 20,
        ...t.extraStyle,
        ...style,
      }}
    >
      {/* Animated grid backdrop — slice preserveAspectRatio so the lanes
          fill the card edge-to-edge and clip at the boundary. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ opacity: t.gridOpacity }}
      >
        <AnimatedGrid
          className={t.gridClass}
          preserveAspectRatio="xMidYMid slice"
        />
      </div>

      {/* Soft radial darken at the bottom on dark tones — keeps text
          readable when the comet pulses pass behind the title. */}
      {tone !== "light" && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 50% 100%, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
      )}

      {/* Foreground content. If `children` is provided, render it raw;
          otherwise compose from the structured props (eyebrow/title/desc). */}
      <div
        className="relative flex flex-col gap-5"
        style={{
          padding: "clamp(20px, 2.2vw, 32px)",
          minHeight: 280,
        }}
      >
        {children ?? (
          <>
            {icon && (
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor:
                    tone === "light"
                      ? "rgba(75, 74, 213, 0.10)"
                      : "rgba(255, 255, 255, 0.12)",
                  border:
                    tone === "light"
                      ? "1px solid rgba(75, 74, 213, 0.18)"
                      : "1px solid rgba(255, 255, 255, 0.18)",
                }}
              >
                {icon}
              </div>
            )}

            {eyebrow && (
              <span
                className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]"
                style={{
                  fontFamily: "var(--font-sans)",
                  color:
                    tone === "light"
                      ? "var(--tp-violet-700)"
                      : "rgba(255,255,255,0.92)",
                  backgroundColor:
                    tone === "light"
                      ? "rgba(138, 77, 187, 0.08)"
                      : "rgba(255, 255, 255, 0.10)",
                  borderColor:
                    tone === "light"
                      ? "rgba(138, 77, 187, 0.18)"
                      : "rgba(255, 255, 255, 0.18)",
                }}
              >
                {eyebrow}
              </span>
            )}

            {title && (
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: "clamp(20px, 1.8vw, 28px)",
                  lineHeight: 1.18,
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}

            {description && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(14px, 1.05vw, 16px)",
                  lineHeight: 1.55,
                  color: t.muted,
                  margin: 0,
                }}
              >
                {description}
              </p>
            )}

            {cta && <div className="mt-auto pt-2">{cta}</div>}
            {footer && <div className="mt-auto pt-2">{footer}</div>}
          </>
        )}
      </div>
    </div>
  );
}
