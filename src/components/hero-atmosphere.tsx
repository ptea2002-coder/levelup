"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  tone: number;
};

export function HeroAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -1000, y: -1000, active: false };
    const particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let lastFrame = 0;
    let visible = true;
    let disposed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;

      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const count = Math.min(54, Math.max(20, Math.round((width * height) / 14500)));
      particles.length = 0;
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.2 - 0.035,
          radius: Math.random() * 1.25 + 0.45,
          phase: Math.random() * Math.PI * 2,
          tone: index % 3,
        });
      }
      draw(0, false);
      start();
    };

    const draw = (time: number, animate: boolean) => {
      context.clearRect(0, 0, width, height);
      const drift = animate ? Math.min(2.2, Math.max(0.5, (time - (lastFrame || time - 16)) / 16.67)) : 0;
      const palette = [
        [199, 255, 70],
        [117, 232, 225],
        [172, 147, 255],
      ] as const;

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        if (animate) {
          particle.phase += 0.012 * drift;
          particle.x += particle.vx * drift;
          particle.y += particle.vy * drift + Math.sin(particle.phase) * 0.045;
          if (particle.x < -12) particle.x = width + 12;
          if (particle.x > width + 12) particle.x = -12;
          if (particle.y < -12) particle.y = height + 12;
          if (particle.y > height + 12) particle.y = -12;

          if (pointer.active) {
            const dx = particle.x - pointer.x;
            const dy = particle.y - pointer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0 && distance < 115) {
              const force = ((115 - distance) / 115) * 0.24 * drift;
              particle.x += (dx / distance) * force;
              particle.y += (dy / distance) * force;
            }
          }
        }
      }

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
          const next = particles[nextIndex];
          const dx = particle.x - next.x;
          const dy = particle.y - next.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 104) continue;
          const alpha = (1 - distance / 104) * 0.19;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(next.x, next.y);
          context.strokeStyle = `rgba(173, 193, 219, ${alpha})`;
          context.lineWidth = 0.55;
          context.stroke();
        }
      }

      particles.forEach((particle) => {
        const [red, green, blue] = palette[particle.tone];
        const twinkle = 0.58 + (Math.sin(particle.phase) + 1) * 0.2;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${twinkle})`;
        context.fill();
      });

      if (pointer.active) {
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 150);
        glow.addColorStop(0, "rgba(199,255,70,0.075)");
        glow.addColorStop(1, "rgba(199,255,70,0)");
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      }
    };

    const tick = (time: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden || reducedMotion) return;
      if (time - lastFrame < 30) {
        frame = window.requestAnimationFrame(tick);
        return;
      }
      draw(time, true);
      lastFrame = time;
      frame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (!disposed && !reducedMotion && visible && !document.hidden && !frame) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      pointer.active = inside;
      if (inside) {
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
      }
    };

    const onPointerLeave = () => { pointer.active = false; };
    const onVisibilityChange = () => document.hidden ? stop() : start();

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting);
          if (visible) start();
          else stop();
        }, { threshold: 0.01 });

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    observer?.observe(canvas);
    resize();

    return () => {
      disposed = true;
      stop();
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-atmosphere" aria-hidden="true" />;
}
