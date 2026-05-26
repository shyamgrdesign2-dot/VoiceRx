import "@/src/design-system/marketing.css";
import { PageShell } from "@/src/components/marketing";

// Marketing route layout — applies to every /site/* page. Loads the
// marketing CSS layer (--section-w, reveal animations, glass utilities)
// and wraps children in the shared PageShell (header + main + footer).
//
// Existing dashboard routes (/, /rxpad/*, /all-patients, etc.) do NOT
// import this layout, so they are unaffected.

export const metadata = {
  title: "TatvaPractice · AI-native clinical workspace",
  description:
    "Appointments, voice-driven prescriptions, and visit continuity in one surface — built around how clinicians actually work.",
};

export default function SiteLayout({ children }) {
  return <PageShell>{children}</PageShell>;
}
