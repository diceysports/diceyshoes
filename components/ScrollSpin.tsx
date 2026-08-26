"use client";

import { useEffect, useRef } from "react";

/**
 * Rotates its children proportionally to how far the page has been
 * scrolled since this element entered the viewport. No animation
 * library — just a scroll listener + requestAnimationFrame, since a
 * one-element rotation doesn't justify a new dependency (per the
 * project's "ask before adding a dependency" rule).
 *
 * `speed` controls degrees of rotation per pixel scrolled. Kept subtle
 * by default so it reads as "alive" rather than dizzying.
 */
export function ScrollSpin({
  children,
  speed = 0.12,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number>();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    function onScroll() {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rotation = window.scrollY * speed;
        ref.current.style.transform = `rotate(${rotation}deg)`;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
