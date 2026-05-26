import Container from "./Container";
import SectionBg from "./SectionBg";

// Section — the canonical wrapper used by every marketing section.
// Composes:
//   - relative w-full overflow-hidden (so SectionBg can absolute-fill)
//   - SectionBg with chosen wash variant
//   - Container with shared --section-w width
//   - Vertical rhythm via clamp() so we don't need breakpoints
//
// Use this everywhere instead of hand-rolling <section> tags.

export default function Section({
  children,
  bg = "lavender",
  withGrid = true,
  intensity = 1,
  wide = false,
  padY = "normal",
  className = "",
  id,
  style,
}) {
  const padding = {
    none: { paddingTop: 0, paddingBottom: 0 },
    tight: {
      paddingTop: "clamp(40px, 4vw, 64px)",
      paddingBottom: "clamp(40px, 4vw, 64px)",
    },
    normal: {
      paddingTop: "clamp(72px, 7vw, 120px)",
      paddingBottom: "clamp(72px, 7vw, 120px)",
    },
    hero: {
      paddingTop: "clamp(96px, 9vw, 168px)",
      paddingBottom: "clamp(64px, 6vw, 96px)",
    },
  }[padY];

  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden ${className}`.trim()}
      style={{ ...padding, ...style }}
    >
      <SectionBg variant={bg} withGrid={withGrid} intensity={intensity} />
      <Container wide={wide} style={{ position: "relative", zIndex: 1 }}>
        {children}
      </Container>
    </section>
  );
}
