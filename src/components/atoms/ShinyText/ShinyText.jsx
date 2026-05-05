"use client";

/**
 * ShinyText — animated bg-clip-text shine that sweeps across a text node.
 *
 * Hand-rolled (no `motion` / framer-motion). Uses a single
 * requestAnimationFrame loop and writes `backgroundPosition` directly
 * to the DOM element via ref. Pauses on hover when requested. Same
 * public API as the previous motion-based version.
 */

import { useEffect, useRef, useState } from "react";

export default function ShinyText({
  text,
  disabled = false,
  speed = 2,
  className = "",
  color = "#b5b5b5",
  shineColor = "#ffffff",
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = "left",
  delay = 0,
}) {
  const [isPaused, setIsPaused] = useState(false);
  const spanRef = useRef(null);

  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  useEffect(() => {
    if (disabled) return;
    let raf = 0;
    let lastTime = null;
    let elapsed = 0;
    const dirSign = direction === "left" ? 1 : -1;

    const tick = (time) => {
      if (isPaused) {
        lastTime = null;
        raf = requestAnimationFrame(tick);
        return;
      }
      if (lastTime === null) {
        lastTime = time;
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = time - lastTime;
      lastTime = time;
      elapsed += dt;

      let p;
      if (yoyo) {
        const cycleDuration = animationDuration + delayDuration;
        const fullCycle = cycleDuration * 2;
        const cycleTime = elapsed % fullCycle;
        if (cycleTime < animationDuration) {
          p = (cycleTime / animationDuration) * 100;
          p = dirSign === 1 ? p : 100 - p;
        } else if (cycleTime < cycleDuration) {
          p = dirSign === 1 ? 100 : 0;
        } else if (cycleTime < cycleDuration + animationDuration) {
          const reverseTime = cycleTime - cycleDuration;
          p = 100 - (reverseTime / animationDuration) * 100;
          p = dirSign === 1 ? p : 100 - p;
        } else {
          p = dirSign === 1 ? 0 : 100;
        }
      } else {
        const cycleDuration = animationDuration + delayDuration;
        const cycleTime = elapsed % cycleDuration;
        if (cycleTime < animationDuration) {
          p = (cycleTime / animationDuration) * 100;
          p = dirSign === 1 ? p : 100 - p;
        } else {
          p = dirSign === 1 ? 100 : 0;
        }
      }
      const node = spanRef.current;
      if (node) node.style.backgroundPosition = `${150 - p * 2}% center`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [disabled, isPaused, animationDuration, delayDuration, yoyo, direction]);

  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true);
  };
  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false);
  };

  // Build the highlight band. For a single colour we keep the simple
  // base→shine→base sweep. For an array of stops the band spans
  // 38-62% (≈25% wide) so the multi-stop gradient is visibly moving.
  const highlightStops = Array.isArray(shineColor)
    ? shineColor
        .map((c, i, arr) => {
          const start = 38;
          const end = 62;
          const pct = arr.length === 1 ? 50 : start + ((end - start) / (arr.length - 1)) * i;
          return `${c} ${pct.toFixed(2)}%`;
        })
        .join(", ")
    : `${shineColor} 50%`;
  const baseEdgeIn = Array.isArray(shineColor) ? "32%" : "35%";
  const baseEdgeOut = Array.isArray(shineColor) ? "68%" : "65%";
  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} ${baseEdgeIn}, ${highlightStops}, ${color} ${baseEdgeOut}, ${color} 100%)`,
    backgroundSize: "200% auto",
    backgroundPosition: "150% center",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <span
      ref={spanRef}
      className={`shiny-text ${className}`}
      style={gradientStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {text}
    </span>
  );
}
