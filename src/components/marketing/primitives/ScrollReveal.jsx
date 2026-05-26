"use client";

import { useEffect, useRef, useState } from "react";

// ScrollReveal — IntersectionObserver wrapper. Adds `.is-visible` to the
// wrapped element once it scrolls into view, triggering the matching
// `.reveal-*` CSS transition defined in src/design-system/marketing.css.
//
// `once={true}` to leave the element revealed on scroll-out.
// `once={false}` (default) re-hides on scroll-out for a "scrubbing" feel.

export default function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  threshold = 0.15,
  once = false,
  className = "",
  as: Tag = "div",
  style,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) obs.unobserve(e.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  const cls = `reveal-${variant} ${visible ? "is-visible" : ""} ${className}`.trim();
  const mergedStyle = { transitionDelay: `${delay}ms`, ...style };

  return (
    <Tag ref={ref} className={cls} style={mergedStyle}>
      {children}
    </Tag>
  );
}
