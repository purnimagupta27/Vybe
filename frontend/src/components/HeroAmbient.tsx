import { useEffect, useRef } from "react";

/* Ambient hero field, ported from the reference hero: hairline ripples
   expanding from two anchors, three slow orbit arcs, and rising motes.
   Purely decorative — it sits under the figure and the copy, pauses while
   off-screen or in a background tab, and renders one still frame when the
   visitor asks for reduced motion. */

type Rgb = { r: number; g: number; b: number };

type Ripple = {
  origin: number;
  born: number;
  life: number;
  maxR: number;
  peak: number;
  accent: boolean;
};

type Mote = {
  bx: number;
  y: number;
  vy: number;
  swayAmp: number;
  swayW: number;
  phase: number;
  size: number;
  baseA: number;
  twW: number;
  accent: boolean;
};

const ORIGINS = [
  { x: 0.76, y: 0.2, maxR: 0.5 },
  { x: 0.13, y: 0.56, maxR: 0.38 },
];

const ARCS = [
  { origin: 0, radius: 0.24, span: 1.7, speed: 0.028, phase: 0.4, ink: 0.075, accent: false },
  { origin: 0, radius: 0.33, span: 0.85, speed: -0.017, phase: 2.6, ink: 0.1, accent: true },
  { origin: 1, radius: 0.27, span: 1.25, speed: 0.021, phase: 4.4, ink: 0.06, accent: false },
];

/* Hairlines read as neutral light; the 30% "accent" rings pick up the
   hero's gold so the field ties to the waveform mark. */
const INK: Rgb = { r: 250, g: 250, b: 250 };
const ACCENT: Rgb = { r: 179, g: 171, b: 128 };

const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);
const rgba = (color: Rgb, alpha: number) =>
  `rgba(${color.r},${color.g},${color.b},${alpha.toFixed(3)})`;

export default function HeroAmbient() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let motes: Mote[] = [];
    const seedMotes = () => {
      const count = Math.max(14, Math.min(30, Math.round((width * height) / 42_000)));
      motes = Array.from({ length: count }, () => ({
        bx: Math.random() * width,
        y: Math.random() * height,
        vy: 2.5 + Math.random() * 4.5,
        swayAmp: 6 + Math.random() * 16,
        swayW: (Math.PI * 2) / (9 + Math.random() * 9),
        phase: Math.random() * Math.PI * 2,
        size: 0.7 + Math.random() * 1.1,
        baseA: 0.09 + Math.random() * 0.13,
        twW: 0.35 + Math.random() * 0.5,
        accent: Math.random() < 0.24,
      }));
    };
    seedMotes();

    let ripples: Ripple[] = [];
    let rippleIndex = 0;
    let nextSpawn = 0;

    const makeRipple = (time: number, origin?: number): Ripple => {
      const index = origin ?? rippleIndex++ % 2;
      const accent = Math.random() < 0.3;
      return {
        origin: index,
        born: time,
        life: 16_000 + Math.random() * 6_000,
        maxR:
          Math.min(width, height) *
          ORIGINS[index].maxR *
          (0.85 + Math.random() * 0.3),
        peak: accent ? 0.17 : 0.1,
        accent,
      };
    };

    /* Three ripples are already in flight on first paint. */
    ripples = [0.32, 0.58, 0.82].map((progress, i) => {
      const life = 16_000 + i * 2_500;
      const ripple = makeRipple(-progress * life, i % 2);
      ripple.life = life;
      ripple.born = -progress * life;
      return ripple;
    });

    const draw = (time: number, dt: number) => {
      ctx.clearRect(0, 0, width, height);
      const seconds = time / 1000;
      const shortest = Math.min(width, height);

      ripples = ripples.filter((ripple) => (time - ripple.born) / ripple.life < 1);

      for (const ripple of ripples) {
        const progress = (time - ripple.born) / ripple.life;
        if (progress < 0) continue;

        const radius = ripple.maxR * easeOutSine(Math.min(1, progress));
        const envelope = Math.pow(Math.sin(Math.PI * Math.min(1, progress)), 1.1);
        const alpha = ripple.peak * envelope;
        const color = ripple.accent ? ACCENT : INK;
        const { x, y } = ORIGINS[ripple.origin];

        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(color, alpha);
        ctx.beginPath();
        ctx.arc(x * width, y * height, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = rgba(color, alpha * 0.4);
        ctx.beginPath();
        ctx.arc(x * width, y * height, radius * 0.88, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (time >= nextSpawn) {
        ripples.push(makeRipple(time));
        nextSpawn = time + 3800 + Math.random() * 2600;
      }

      for (const arc of ARCS) {
        const radius =
          Math.max(90, Math.min(460, arc.radius * shortest)) *
          (1 + 0.018 * Math.sin(seconds * 0.13 + arc.phase * 2));
        const start = arc.phase + arc.speed * seconds;
        const { x, y } = ORIGINS[arc.origin];

        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(arc.accent ? ACCENT : INK, arc.ink);
        ctx.beginPath();
        ctx.arc(x * width, y * height, radius, start, start + arc.span);
        ctx.stroke();
      }

      for (const mote of motes) {
        mote.y -= mote.vy * dt;
        if (mote.y < -12) {
          mote.y = height + 10;
          mote.bx = Math.random() * width;
        }
        const x = mote.bx + Math.sin(seconds * mote.swayW + mote.phase) * mote.swayAmp;
        const alpha = Math.max(
          0,
          mote.baseA * (0.62 + 0.38 * Math.sin(seconds * mote.twW + mote.phase * 1.7)),
        );
        ctx.fillStyle = rgba(mote.accent ? ACCENT : INK, alpha);
        ctx.beginPath();
        ctx.arc(x, mote.y, mote.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /* Reduced motion: one composed still frame, no loop. */
    const drawStill = () => {
      const now = performance.now();
      const held = ripples;
      ripples = [0.24, 0.52, 0.78].map((progress, i) => {
        const life = 16_000 + i * 2_500;
        return {
          origin: i % 2,
          born: now - progress * life,
          life,
          maxR: Math.min(width, height) * ORIGINS[i % 2].maxR * 0.95,
          peak: i === 1 ? 0.17 : 0.1,
          accent: i === 1,
        };
      });
      draw(now, 0);
      ripples = held;
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resizeObserver = new ResizeObserver(() => {
      // Resizing resets the backing store, so repaint the still frame when
      // the visitor is not running the loop.
      resize();
      seedMotes();
      if (reduceMotion.matches) drawStill();
    });
    resizeObserver.observe(host);

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "80px" },
    );
    intersectionObserver.observe(host);

    let frame = 0;
    let lastTime = performance.now();

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (reduceMotion.matches || !visible || document.hidden) {
        lastTime = time;
        return;
      }
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      draw(time, dt);
    };

    const handleMotionChange = () => {
      if (reduceMotion.matches) {
        cancelAnimationFrame(frame);
        drawStill();
      } else {
        lastTime = performance.now();
        nextSpawn = lastTime + 1200;
      }
    };
    reduceMotion.addEventListener("change", handleMotionChange);

    host.style.opacity = "1";
    if (reduceMotion.matches) {
      drawStill();
    } else {
      nextSpawn = performance.now() + 1400;
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reduceMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="hero-ambient pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-[1600ms] ease-out"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
