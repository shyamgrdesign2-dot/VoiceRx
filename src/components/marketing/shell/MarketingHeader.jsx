"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// MarketingHeader — sticky frosted-glass nav pill at the top of every
// subpage. Mirrors TP_website's pattern: pill with horizontal padding,
// border, backdrop-blur. Mobile reveals a vertical menu under the pill.
//
// Nav items are passed in so different subpages can highlight different
// sections (default set covers a typical SaaS landing).

const DEFAULT_NAV = [
  { label: "Product", href: "/site#product" },
  { label: "Solutions", href: "/site#solutions" },
  { label: "Pricing", href: "/site#pricing" },
  { label: "About", href: "/site/about" },
];

export default function MarketingHeader({
  nav = DEFAULT_NAV,
  ctaLabel = "Book a demo",
  ctaHref = "/site#contact",
  brand = "TatvaPractice",
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
      style={{ pointerEvents: "none" }}
    >
      <nav
        className="glass-surface mx-auto flex items-center justify-between rounded-[20px] transition-shadow"
        style={{
          width: "var(--section-w-wide)",
          maxWidth: "var(--section-w-wide)",
          padding: "10px 14px 10px 20px",
          pointerEvents: "auto",
          boxShadow: scrolled
            ? "0 8px 24px rgba(75, 74, 213, 0.12), 0 1px 0 rgba(255,255,255,1) inset"
            : "0 4px 14px rgba(75, 74, 213, 0.06), 0 1px 0 rgba(255,255,255,1) inset",
        }}
      >
        <Link
          href="/site"
          className="flex items-center gap-2"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 17,
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
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm transition-colors"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  color: "var(--tp-slate-700)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(75, 74, 213, 0.06)";
                  e.currentTarget.style.color = "var(--tp-blue-700)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--tp-slate-700)";
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href={ctaHref}
            className="cta-shimmer hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#fff",
              backgroundImage:
                "linear-gradient(135deg, var(--tp-blue-500) 0%, var(--tp-blue-900) 100%)",
            }}
          >
            {ctaLabel}
          </Link>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full"
            onClick={() => setOpen((v) => !v)}
            style={{
              backgroundColor: "rgba(75, 74, 213, 0.08)",
              color: "var(--tp-blue-700)",
            }}
          >
            <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div
          className="glass-surface mx-auto mt-2 rounded-2xl p-3 md:hidden"
          style={{
            width: "var(--section-w-wide)",
            maxWidth: "var(--section-w-wide)",
            pointerEvents: "auto",
          }}
        >
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 500,
                    color: "var(--tp-slate-700)",
                  }}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t pt-3" style={{ borderColor: "rgba(75, 74, 213, 0.12)" }}>
              <Link
                href={ctaHref}
                className="cta-shimmer block rounded-full px-4 py-2.5 text-center text-sm font-semibold"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "#fff",
                  backgroundImage:
                    "linear-gradient(135deg, var(--tp-blue-500) 0%, var(--tp-blue-900) 100%)",
                }}
                onClick={() => setOpen(false)}
              >
                {ctaLabel}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
