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
  ".gamer-command-shell",
  ".steam-live-card",
  ".lfg-card",
  ".social-post-card",
];

export function MotionEffects() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            activeObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -36px 0px" }
    );

    let revealIndex = 0;
    const selector = REVEAL_SELECTORS.join(",");
    const prepare = (node: Node) => {
      if (!(node instanceof HTMLElement)) return;
      const candidates = [
        ...(node.matches(selector) ? [node] : []),
        ...Array.from(node.querySelectorAll<HTMLElement>(selector)),
      ];
      candidates.forEach((element) => {
        if (element.classList.contains("motion-reveal")) return;
        element.classList.add("motion-reveal");
        element.style.setProperty("--motion-delay", `${(revealIndex++ % 5) * 55}ms`);
        observer.observe(element);
      });
    };

    prepare(document.body);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(prepare));
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!supportsHover || prefersReducedMotion) return;

    const cleanups: Array<() => void> = [];
    const hero = document.querySelector<HTMLElement>(".hero-visual");

    if (hero) {
      const onMove = (event: PointerEvent) => {
        const rect = hero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        hero.style.setProperty("--pointer-x", `${(x * 100).toFixed(1)}%`);
        hero.style.setProperty("--pointer-y", `${(y * 100).toFixed(1)}%`);
        hero.style.setProperty("--tilt-x", `${((0.5 - y) * 4).toFixed(2)}deg`);
        hero.style.setProperty("--tilt-y", `${((x - 0.5) * 4).toFixed(2)}deg`);
        hero.classList.add("is-interacting");
      };
      const onLeave = () => hero.classList.remove("is-interacting");
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        hero.removeEventListener("pointermove", onMove);
        hero.removeEventListener("pointerleave", onLeave);
      });
    }

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(".game-card, .article-card, .steam-live-card, .lfg-card")
    );
    cards.forEach((card) => {
      const onMove = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        card.style.setProperty("--card-x", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--card-y", `${(y * 100).toFixed(1)}%`);
        card.style.setProperty("--card-tilt-x", `${((0.5 - y) * 2.6).toFixed(2)}deg`);
        card.style.setProperty("--card-tilt-y", `${((x - 0.5) * 3.6).toFixed(2)}deg`);
        card.classList.add("is-tilting");
      };
      const onLeave = () => card.classList.remove("is-tilting");
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
