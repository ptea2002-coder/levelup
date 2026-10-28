"use client";

import { useEffect } from "react";

const REVEAL_SELECTORS = [
  ".section-head",
  ".game-card",
  ".article-card",
  ".community-panel",
  ".detail-info-panel",
  ".page-hero",
  ".detail-layout",
  ".inline-cta",
];

export function MotionEffects() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTORS.join(","))
    );

    if (!elements.length) return;

    elements.forEach((element, index) => {
      element.classList.add("motion-reveal");
      element.style.setProperty("--motion-delay", `${(index % 5) * 55}ms`);
    });

    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            activeObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.07,
        rootMargin: "0px 0px -36px 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
