"use client";

import React from "react";
import styles from "../../styles/particles/ParticlesBackground.module.css";

type Props = {
  className?: string;
  tone?: "black" | "blue";
  maxParticles?: number;
  intensity?: "full" | "subtle";
  disablePointerRepel?: boolean;
};

type ColorKind = "blue" | "dark";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseAlpha: number;
  phase: number;
  wiggleAmp: number;
  wiggleSpeed: number;
  color: ColorKind;
  neighborIndices: number[];
};

function getColorRgba(color: ColorKind, alpha: number): string {
  switch (color) {
    case "blue":
      return `rgba(59, 130, 246, ${alpha})`;
    default:
      return `rgba(30, 30, 45, ${alpha})`;
  }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

export function ParticlesBackground({
  className,
  tone = "black",
  maxParticles: maxParticlesProp,
  intensity = "full",
  disablePointerRepel = false,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isSubtle = intensity === "subtle";

  const pointerRef = React.useRef<{
    x: number;
    y: number;
    active: boolean;
  }>({ x: 0, y: 0, active: false });

  React.useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const particles: Particle[] = [];

    const getSize = () => {
      const rect = wrapper.getBoundingClientRect();
      return { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };
    };

    const init = () => {
      particles.length = 0;
      const { w, h } = getSize();

      let targetCount = Math.min(
        500,
        Math.max(150, Math.floor((w * h) / 8000)),
      );
      if (maxParticlesProp != null) {
        targetCount = Math.min(targetCount, maxParticlesProp);
      }
      if (isSubtle) {
        targetCount = Math.min(targetCount, 50);
      }

      const colorWeight = (): ColorKind => {
        const r = Math.random();
        if (r < 0.5) return "blue";
        return "dark";
      };

      const baseR = isSubtle ? 0.55 : 0.7;
      const baseAlphaMin = isSubtle ? 0.08 : 0.12;
      const baseAlphaRange = isSubtle ? 0.08 : 0.12;

      for (let i = 0; i < targetCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: baseR + Math.random() * (isSubtle ? 0.55 : 1),
          baseAlpha: baseAlphaMin + Math.random() * baseAlphaRange,
          phase: Math.random() * Math.PI * 2,
          wiggleAmp: 0.25 + Math.random() * 0.7,
          wiggleSpeed: 0.5 + Math.random() * 0.8,
          color: colorWeight(),
          neighborIndices: [],
        });
      }

      const linkMaxRadius = isSubtle ? 45 : 85;
      const linkMaxRadius2 = linkMaxRadius * linkMaxRadius;
      const maxNeighbors = isSubtle ? 1 : 2;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const candidates: { j: number; dist2: number }[] = [];
        for (let j = 0; j < particles.length; j++) {
          if (j === i) continue;
          const dx = particles[j].x - p.x;
          const dy = particles[j].y - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 <= linkMaxRadius2) candidates.push({ j, dist2 });
        }
        candidates.sort((a, b) => a.dist2 - b.dist2);
        p.neighborIndices = candidates
          .slice(0, maxNeighbors)
          .map((c) => c.j);
      }
    };

    const resize = () => {
      const { w, h } = getSize();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrapper);
    resize();

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      pointerRef.current.x = x;
      pointerRef.current.y = y;
      pointerRef.current.active = inside;
    };

    const onBlur = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onBlur);

    const step = () => {
      const t = performance.now() * 0.001;
      const { w, h } = getSize();

      ctx.clearRect(0, 0, w, h);

      const px = pointerRef.current.x;
      const py = pointerRef.current.y;
      const pointerActive = pointerRef.current.active;

      const drawLinkMaxRadius = isSubtle ? 50 : 90;
      const drawLinkMaxRadius2 = drawLinkMaxRadius * drawLinkMaxRadius;
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const wiggleX = Math.sin(t * p.wiggleSpeed + p.phase) * p.wiggleAmp;
        const wiggleY =
          Math.cos(t * (p.wiggleSpeed * 0.92) + p.phase) * p.wiggleAmp;
        const px1 = p.x + wiggleX;
        const py1 = p.y + wiggleY;
        for (const j of p.neighborIndices) {
          const q = particles[j];
          const wqx = Math.sin(t * q.wiggleSpeed + q.phase) * q.wiggleAmp;
          const wqy =
            Math.cos(t * (q.wiggleSpeed * 0.92) + q.phase) * q.wiggleAmp;
          const qx1 = q.x + wqx;
          const qy1 = q.y + wqy;
          const dx = qx1 - px1;
          const dy = qy1 - py1;
          const dist2 = dx * dx + dy * dy;
          if (dist2 > drawLinkMaxRadius2) continue;
          const linkAlpha = isSubtle ? 0.02 : 0.03;
          const alpha = linkAlpha * (1 - 0.5 * Math.random());
          ctx.strokeStyle = getColorRgba(p.color, alpha);
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(qx1, qy1);
          ctx.stroke();
        }
      }

      const drag = 0.985;
      const drift = 0.02;
      const repelRadius = 120;
      const repelStrength = 0.85;

      for (const p of particles) {
        p.vx += (Math.random() - 0.5) * drift * 0.02;
        p.vy += (Math.random() - 0.5) * drift * 0.02;

        p.vx += Math.sin(t * 0.65 + p.phase) * 0.0022;
        p.vy += Math.cos(t * 0.55 + p.phase) * 0.0022;

        if (pointerActive && !disablePointerRepel) {
          const dx = p.x - px;
          const dy = p.y - py;
          const dist2 = dx * dx + dy * dy;
          const r2 = repelRadius * repelRadius;
          if (dist2 < r2 && dist2 > 0.0001) {
            const dist = Math.sqrt(dist2);
            const t2 = 1 - dist / repelRadius;
            const fx = (dx / dist) * t2 * repelStrength;
            const fy = (dy / dist) * t2 * repelStrength;
            p.vx += fx * 0.35;
            p.vy += fy * 0.35;
          }
        }

        p.vx *= drag;
        p.vy *= drag;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        const wiggleX = Math.sin(t * p.wiggleSpeed + p.phase) * p.wiggleAmp;
        const wiggleY =
          Math.cos(t * (p.wiggleSpeed * 0.92) + p.phase) * p.wiggleAmp;

        ctx.beginPath();
        const drawAlpha = isSubtle ? p.baseAlpha * 0.9 : p.baseAlpha;
        ctx.fillStyle = getColorRgba(p.color, drawAlpha);
        ctx.arc(p.x + wiggleX, p.y + wiggleY, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (pointerActive) {
        const connectRadius = isSubtle ? 50 : 110;
        const connectRadius2 = connectRadius * connectRadius;
        const connectAlphaMax = isSubtle ? 0.08 : 0.12;
        ctx.lineWidth = 1;
        for (const p of particles) {
          const dx = p.x - px;
          const dy = p.y - py;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < connectRadius2) {
            const dist = Math.sqrt(dist2);
            const a = (1 - dist / connectRadius) * connectAlphaMax;
            if (a <= 0) continue;
            ctx.strokeStyle = getColorRgba(p.color, a);
            ctx.beginPath();
            ctx.moveTo(px, py);
            const wiggleX = Math.sin(t * p.wiggleSpeed + p.phase) * p.wiggleAmp;
            const wiggleY =
              Math.cos(t * (p.wiggleSpeed * 0.92) + p.phase) * p.wiggleAmp;
            ctx.lineTo(p.x + wiggleX, p.y + wiggleY);
            ctx.stroke();
          }
        }
      }

      raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onBlur);
      window.cancelAnimationFrame(raf);
    };
  }, [prefersReducedMotion, tone, maxParticlesProp, isSubtle, disablePointerRepel]);

  return (
    <div ref={wrapperRef} className={`${styles.wrapper} ${className ?? ""}`}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
