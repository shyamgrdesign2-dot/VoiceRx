import Link from "next/link";
import Container from "../primitives/Container";

// MarketingFooter — last section on every marketing subpage. Compact
// link columns + brand line + copyright. Sits on the off-white body bg
// (no atmospheric wash, so it reads as a "rest point" after the last
// content section).

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "VoiceRx", href: "/site#voicerx" },
      { label: "SmartSync", href: "/site#smartsync" },
      { label: "SnapRx", href: "/site#snaprx" },
      { label: "Appointments", href: "/site#appointments" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/site/about" },
      { label: "Careers", href: "/site#careers" },
      { label: "Contact", href: "/site#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/site#docs" },
      { label: "Changelog", href: "/site#changelog" },
      { label: "Support", href: "/site#support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/site#privacy" },
      { label: "Terms", href: "/site#terms" },
      { label: "Security", href: "/site#security" },
    ],
  },
];

export default function MarketingFooter({ brand = "TatvaPractice" }) {
  return (
    <footer
      className="relative w-full"
      style={{
        paddingTop: "clamp(48px, 5vw, 80px)",
        paddingBottom: "clamp(32px, 3vw, 48px)",
        borderTop: "1px solid rgba(75, 74, 213, 0.08)",
        backgroundColor: "#FBF8FF",
      }}
    >
      <Container>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <div
              className="flex items-center gap-2"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.01em",
                color: "var(--tp-blue-900)",
              }}
            >
              <span
                aria-hidden
                className="inline-block h-7 w-7 rounded-lg"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--tp-blue-500) 0%, var(--tp-violet-700) 100%)",
                  boxShadow: "0 4px 12px rgba(75, 74, 213, 0.35)",
                }}
              />
              {brand}
            </div>
            <p
              style={{
                marginTop: 12,
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--tp-slate-500)",
                maxWidth: 320,
              }}
            >
              An AI-native clinical workspace — appointments, voice-driven
              prescriptions, and continuity baked into a single surface.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--tp-slate-500)",
                  marginBottom: 12,
                }}
              >
                {col.title}
              </div>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                        color: "var(--tp-slate-700)",
                      }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          style={{
            paddingTop: 20,
            borderTop: "1px solid rgba(75, 74, 213, 0.08)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: "var(--tp-slate-500)",
            }}
          >
            © {new Date().getFullYear()} TatvaCare Inc. All rights reserved.
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: "var(--tp-slate-500)",
            }}
          >
            Built with care for clinicians.
          </p>
        </div>
      </Container>
    </footer>
  );
}
