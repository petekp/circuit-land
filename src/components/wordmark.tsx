"use client";

import { useEffect, useRef } from "react";

const WORD = "CIRCUIT";

/*
 * The wordmark fill is a field of many thin (1-2px) horizontal streaks in
 * the flow colors, drifting right-to-left at a range of speeds so the layers
 * read as parallax depth. The field is painted on a canvas and then clipped
 * to the letter shapes, so the energy only shows through "CIRCUIT". Streaks
 * wrap continuously (exit left, re-enter right), so the motion never cuts.
 *
 * Colors are read from the same CSS custom properties globals.css uses, so
 * the canvas stays in sync with the rest of the brand palette. The plain
 * text + static .circuit-wordmark gradient stay as the fallback for no-JS,
 * pre-mount, and reduced-motion.
 */

const FLOW_VARS = [
  "--flow-explore",
  "--flow-build",
  "--flow-fix",
  "--flow-review",
  "--flow-prototype",
  "--flow-pursue",
] as const;

const FLOW_FALLBACK = [
  "hsl(188 100% 42%)",
  "hsl(21 100% 55%)",
  "hsl(339 82% 52%)",
  "hsl(145 100% 39%)",
  "hsl(254 100% 65%)",
  "hsl(43 92% 55%)",
];

type Streak = {
  x: number; // head x (device px); decreases over time -> moves left
  y: number; // row center (device px)
  len: number; // comet length (device px)
  speed: number; // device px per second
  thickness: number; // device px
  alpha: number; // peak alpha
  color: string; // hsl(...) string
};

// "hsl(188 100% 42%)" -> "hsl(188 100% 42% / 0.4)"
function withAlpha(hsl: string, a: number) {
  return hsl.replace(/\s*\)\s*$/, ` / ${a})`);
}

export function Wordmark({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wrap = wrapRef.current;
    const text = textRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !text || !canvas) return;
    const fallbackText = text;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const root = getComputedStyle(document.documentElement);
    const colors = FLOW_VARS.map(
      (v, i) => root.getPropertyValue(v).trim() || FLOW_FALLBACK[i],
    );

    let raf = 0;
    let streaks: Streak[] = [];
    let W = 0;
    let H = 0;
    let dpr = 1;
    let font = "";
    let letterSpacing = "0px";
    let last = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function makeStreak(initial: boolean): Streak {
      // depth in [0,1]: near streaks are faster, brighter, thicker.
      const depth = Math.random();
      const near = depth > 0.78;
      const speed = (rand(16, 30) + depth * 78) * dpr;
      // device-pixel thin: most streaks are a single device pixel (sub-pixel
      // on hi-dpi), a few near ones get 2 for a touch of depth.
      const thickness = near ? 2 : 1;
      const alpha = 0.28 + depth * 0.6;
      const len = rand(near ? 26 : 10, near ? 78 : 38) * dpr;
      const color = colors[Math.floor(Math.random() * colors.length)];
      // start spread across the field, then re-enter staggered off the right
      const x = initial ? rand(0, W + len) : W + len + rand(0, W * 0.6);
      const y = Math.floor(rand(0, H)) + 0.5;
      return { x, y, len, speed, thickness, alpha, color };
    }

    function measure() {
      const cs = getComputedStyle(text as HTMLSpanElement);
      const rect = (wrap as HTMLSpanElement).getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(rect.width * dpr));
      H = Math.max(1, Math.round(rect.height * dpr));
      (canvas as HTMLCanvasElement).width = W;
      (canvas as HTMLCanvasElement).height = H;
      const sizePx = parseFloat(cs.fontSize) * dpr;
      const ls = (parseFloat(cs.letterSpacing) || 0) * dpr;
      letterSpacing = `${ls}px`;
      font = `${cs.fontWeight || "600"} ${sizePx}px ${cs.fontFamily}`;
      const target = Math.round((W * H) / 80);
      streaks = Array.from({ length: target }, () => makeStreak(true));
    }

    function clipToText(c: CanvasRenderingContext2D) {
      c.globalCompositeOperation = "destination-in";
      c.fillStyle = "#000";
      c.font = font;
      // letterSpacing on the 2D context is supported in current browsers.
      (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        letterSpacing;
      c.textBaseline = "middle";
      c.textAlign = "left";
      c.fillText(WORD, 0, H / 2 + 1);
      c.globalCompositeOperation = "source-over";
    }

    function frame(c: CanvasRenderingContext2D, now: number) {
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      c.clearRect(0, 0, W, H);

      // faint full-width body so the letters stay legible between streaks
      const base = c.createLinearGradient(0, 0, W, 0);
      colors.forEach((col, i) =>
        base.addColorStop(i / (colors.length - 1), withAlpha(col, 0.22)),
      );
      c.fillStyle = base;
      c.fillRect(0, 0, W, H);

      // additive streaks read as glowing energy where they overlap
      c.globalCompositeOperation = "lighter";
      for (const s of streaks) {
        s.x -= s.speed * dt;
        if (s.x + s.len < 0) {
          Object.assign(s, makeStreak(false));
          continue;
        }
        const g = c.createLinearGradient(s.x, 0, s.x + s.len, 0);
        g.addColorStop(0, withAlpha(s.color, s.alpha));
        g.addColorStop(0.25, withAlpha(s.color, s.alpha * 0.55));
        g.addColorStop(1, withAlpha(s.color, 0));
        c.fillStyle = g;
        c.fillRect(s.x, s.y - s.thickness / 2, s.len, s.thickness);
      }
      c.globalCompositeOperation = "source-over";

      clipToText(c);
      raf = requestAnimationFrame((t) => frame(c, t));
    }

    function start(c: CanvasRenderingContext2D) {
      measure();
      cancelAnimationFrame(raf);
      last = 0;
      fallbackText.style.opacity = "0";
      raf = requestAnimationFrame((t) => frame(c, t));
    }

    start(ctx);

    const ro = new ResizeObserver(() => start(ctx));
    ro.observe(wrap);
    let refreshed = false;
    document.fonts?.ready.then(() => {
      if (!refreshed) {
        refreshed = true;
        start(ctx);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      fallbackText.style.opacity = "";
    };
  }, []);

  return (
    <span
      ref={wrapRef}
      className={`circuit-wordmark-field relative inline-block font-mono text-xl font-semibold leading-none tracking-[0.18em] sm:text-3xl ${
        className ?? ""
      }`}
    >
      <span ref={textRef} className="circuit-wordmark">
        {WORD}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </span>
  );
}
