// SectionBg — per-section atmospheric backdrop.
//
// Renders a soft radial wash (in one of the brand families) plus an
// optional faint grid pattern that fades out at the section edges via a
// radial mask. Each section gets its OWN self-contained ambience so
// adjacent sections don't visually collide.
//
// Variants pull from the brand palette via CSS vars exposed in
// src/app/globals.css.

export default function SectionBg({
  variant = "lavender",
  withGrid = true,
  intensity = 1,
}) {
  if (variant === "none") return null;

  const washes = {
    lavender: `radial-gradient(ellipse 70% 60% at 50% 50%,
        rgba(186, 125, 233, ${0.12 * intensity}) 0%,
        rgba(138, 77, 187, ${0.07 * intensity}) 30%,
        rgba(213, 101, 234, ${0.05 * intensity}) 60%,
        transparent 90%)`,
    pink: `radial-gradient(ellipse 70% 60% at 50% 50%,
        rgba(213, 101, 234, ${0.10 * intensity}) 0%,
        rgba(186, 125, 233, ${0.06 * intensity}) 35%,
        rgba(103, 58, 172, ${0.04 * intensity}) 65%,
        transparent 92%)`,
    blue: `radial-gradient(ellipse 70% 60% at 50% 50%,
        rgba(75, 74, 213, ${0.11 * intensity}) 0%,
        rgba(46, 45, 150, ${0.06 * intensity}) 35%,
        rgba(186, 125, 233, ${0.04 * intensity}) 65%,
        transparent 92%)`,
    ai: `radial-gradient(ellipse 70% 60% at 50% 50%,
        rgba(213, 101, 234, ${0.10 * intensity}) 0%,
        rgba(103, 58, 172, ${0.08 * intensity}) 35%,
        rgba(26, 25, 148, ${0.05 * intensity}) 70%,
        transparent 95%)`,
  };

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: washes[variant] }}
      />

      {withGrid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(75,74,213,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(75,74,213,0.08) 1px, transparent 1px)",
            backgroundSize: "clamp(40px, 4.5vw, 64px) clamp(40px, 4.5vw, 64px)",
            backgroundPosition: "center center",
            opacity: 0.95,
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 55% at 50% 50%, black 35%, transparent 92%)",
            maskImage:
              "radial-gradient(ellipse 65% 55% at 50% 50%, black 35%, transparent 92%)",
          }}
        />
      )}
    </>
  );
}
