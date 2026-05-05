"use client";

/**
 * Toaster — hand-rolled brand toast surface (no sonner).
 *
 * Mount once at the root layout. Subscribes to `toast-store` and
 * renders each active toast as a centered black pill at the top of
 * the viewport.
 *
 * Behaviour (locked by design):
 *   • Solid black pill (rgba(0,0,0,0.92))
 *   • White text, tight Inter
 *   • Horizontally centered at the top of the viewport (top: 24px)
 *   • Slides DOWN from above on enter, slides BACK UP on exit
 *     (translateY(-12px) ↔ translateY(0)) — matches TPSnackbar's
 *     anchorVertical="top" animation so all transient surfaces in
 *     the app speak the same motion vocabulary.
 *   • No border / no ring
 *
 * Public toast API (mirrors sonner):
 *   import { toast } from "@/src/components/molecules/Toaster";
 *   toast.success("…"); toast.error("…"); toast.message("…", { description });
 */

import * as React from "react";
import { Portal } from "@/src/hooks/ui/Portal";
import { subscribe, dismiss } from "./toast-store";

export { toast } from "./toast-store";

const ENTER_DELAY_MS = 20;     // gives the browser one frame to compute the off-screen state
const EXIT_DURATION_MS = 220;  // matches TPSnackbar transition duration

function ToastItem({ item }) {
  // `entered` flips after first paint so the slide-down animation
  // runs on enter. `item.leaving` (set by toast-store.dismiss) flips
  // back to translateY(-12px) + opacity 0 for the slide-up exit.
  const [entered, setEntered] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setEntered(true), ENTER_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const visible = entered && !item.leaving;

  return (
    <div
      role="status"
      onClick={() => dismiss(item.id)}
      style={{
        pointerEvents: "auto",
        background: "rgba(0,0,0,0.92)",
        color: "#ffffff",
        borderRadius: 9999,
        padding: "10px 18px",
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
        lineHeight: 1.2,
        maxWidth: "min(560px, calc(100vw - 32px))",
        boxShadow: "none",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        transition: `opacity ${EXIT_DURATION_MS}ms ease, transform ${EXIT_DURATION_MS}ms ease`,
      }}>
      <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 500 }}>
        {item.title}
      </div>
      {item.description ? (
        <div
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 12,
            marginTop: 2,
          }}>
          {item.description}
        </div>
      ) : null}
    </div>
  );
}

export function Toaster() {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => subscribe(setItems), []);

  if (!items.length) return null;

  return (
    <Portal>
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: 24,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          zIndex: 9999,
          pointerEvents: "none",
        }}>
        {items.map((t) => (
          <ToastItem key={t.id} item={t} />
        ))}
      </div>
    </Portal>
  );
}
