import MarketingHeader from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";

// PageShell — the reusable subpage skeleton.
//
// Every marketing subpage renders one of these. The shell guarantees:
//   - .marketing-surface body tint
//   - Sticky frosted MarketingHeader at the top
//   - main element (Sections render inside)
//   - MarketingFooter at the bottom
//
// To customize per page, override `nav`, `ctaLabel`, `ctaHref`, `brand`
// or pass a fully custom <header>/<footer> via the named slots.

export default function PageShell({
  children,
  nav,
  ctaLabel,
  ctaHref,
  brand,
  header,
  footer,
}) {
  return (
    <div className="marketing-surface min-h-screen flex flex-col">
      {header ?? (
        <MarketingHeader
          nav={nav}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          brand={brand}
        />
      )}
      <main className="flex-1">{children}</main>
      {footer ?? <MarketingFooter brand={brand} />}
    </div>
  );
}
