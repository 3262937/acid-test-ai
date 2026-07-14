import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "scan" | "part" | "lock" | "cards";

type Beetle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hx: number; // home x
  hy: number; // home y
  a: number; // heading
  va: number;
  size: number;
  shade: number; // 0..1 for gray shade
};

const RED = "#ff4d4d";
const ACID = "#c5ef57";

export function Hunt() {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const beetlesRef = useRef<Beetle[]>([]);
  const targetRef = useRef<{ x: number; y: number; size: number; pulse: number }>({
    x: 0,
    y: 0,
    size: 14,
    pulse: 0,
  });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const phaseRef = useRef<Phase>("idle");
  const phaseStartRef = useRef<number>(0);
  const scanYRef = useRef<number>(-20);
  const spotlightRef = useRef<number>(0); // 0..1
  const dimRef = useRef<number>(0); // 0..1 how much crowd dimmed
  const partRef = useRef<number>(0); // 0..1 how much crowd parted
  const lockRef = useRef<number>(0); // 0..1 crosshair lock progress

  const [phase, setPhase] = useState<Phase>("idle");
  const [readout, setReadout] = useState("");
  const [card1Pass, setCard1Pass] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const hasAutoPlayedRef = useRef(false);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    phaseStartRef.current = performance.now();
    setPhase(p);
  }, []);

  // Build beetles once we know size
  const buildBeetles = useCallback(() => {
    const { w, h } = sizeRef.current;
    const count = 900;
    const arr: Beetle[] = [];
    // Grid-ish jittered placement
    const cols = Math.ceil(Math.sqrt((count * w) / Math.max(1, h)));
    const rows = Math.ceil(count / cols);
    const cellW = w / cols;
    const cellH = h / rows;
    for (let i = 0; i < count; i++) {
      const cx = (i % cols) + 0.5;
      const cy = Math.floor(i / cols) + 0.5;
      const jx = (Math.random() - 0.5) * cellW * 0.9;
      const jy = (Math.random() - 0.5) * cellH * 0.9;
      const x = cx * cellW + jx;
      const y = cy * cellH + jy;
      arr.push({
        x,
        y,
        vx: 0,
        vy: 0,
        hx: x,
        hy: y,
        a: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.02,
        size: 8 + Math.random() * 6,
        shade: Math.random(),
      });
    }
    beetlesRef.current = arr;
    // Place red beetle slightly off-center
    targetRef.current = {
      x: w * 0.58,
      y: h * 0.52,
      size: 16,
      pulse: 0,
    };
  }, []);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      buildBeetles();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [buildBeetles]);

  const drawBeetle = useCallback(
    (ctx: CanvasRenderingContext2D, b: Beetle, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.a);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      // body: 2 ellipses
      const s = b.size;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.15, s * 0.32, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, s * 0.12, s * 0.42, s * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      // legs
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) {
        const ly = i * s * 0.18;
        ctx.moveTo(-s * 0.35, ly);
        ctx.lineTo(-s * 0.55, ly + i * 2);
        ctx.moveTo(s * 0.35, ly);
        ctx.lineTo(s * 0.55, ly + i * 2);
      }
      ctx.stroke();
      ctx.restore();
    },
    [],
  );

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grays = ["#2a2b2c", "#303032", "#353537", "#3a393a"];

    const render = () => {
      const { w, h, dpr } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // background subtle
      ctx.fillStyle = "#070708";
      ctx.fillRect(0, 0, w, h);

      const now = performance.now();
      const t = (now - phaseStartRef.current) / 1000;
      const phase = phaseRef.current;

      // Phase progressions
      if (phase === "scan") {
        scanYRef.current = Math.min(h + 20, -20 + ((h + 40) * t) / 0.9);
        if (t >= 0.9) setPhaseBoth("part");
      } else if (phase === "part") {
        partRef.current = Math.min(1, t / 0.9);
        dimRef.current = Math.min(1, t / 0.9);
        spotlightRef.current = Math.min(1, t / 0.9);
        if (t >= 0.9) setPhaseBoth("lock");
      } else if (phase === "lock") {
        lockRef.current = Math.min(1, t / 0.5);
        if (t >= 0.5 && !showCards) {
          setShowCards(true);
          setPhaseBoth("cards");
          // type out readout
          const full = "1,024 SCANNED · 1 CRITICAL ISOLATED";
          let i = 0;
          const iv = setInterval(() => {
            i++;
            setReadout(full.slice(0, i));
            if (i >= full.length) clearInterval(iv);
          }, 28);
          setTimeout(() => setCard1Pass(true), 1200 + 900);
        }
      }

      // Update + draw crowd
      const target = targetRef.current;
      const partAmt = partRef.current;
      const dimAmt = dimRef.current;

      const beetles = beetlesRef.current;
      for (let i = 0; i < beetles.length; i++) {
        const b = beetles[i];
        // brownian drift toward home
        if (!reduce) {
          b.vx += (Math.random() - 0.5) * 0.08 + (b.hx - b.x) * 0.002;
          b.vy += (Math.random() - 0.5) * 0.08 + (b.hy - b.y) * 0.002;

          // parting force: push away from target
          if (partAmt > 0) {
            const dx = b.x - target.x;
            const dy = b.y - target.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
            const clearing = 140 * partAmt;
            if (dist < clearing + 60) {
              const push = ((clearing + 60 - dist) / (clearing + 60)) * 4 * partAmt;
              b.vx += (dx / dist) * push;
              b.vy += (dy / dist) * push;
              b.a += (Math.atan2(dy, dx) - b.a) * 0.05;
            }
          }

          b.vx *= 0.88;
          b.vy *= 0.88;
          b.x += b.vx;
          b.y += b.vy;
          b.a += b.va;
        }

        const color = grays[Math.floor(b.shade * grays.length) % grays.length];
        const alpha = 1 - dimAmt * 0.6;
        drawBeetle(ctx, b, color, alpha);
      }

      // Spotlight cone over target
      if (spotlightRef.current > 0) {
        const sp = spotlightRef.current;
        const grad = ctx.createRadialGradient(target.x, target.y, 10, target.x, target.y, 220);
        grad.addColorStop(0, `rgba(255, 220, 160, ${0.22 * sp})`);
        grad.addColorStop(0.5, `rgba(255, 200, 120, ${0.08 * sp})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 220, 0, Math.PI * 2);
        ctx.fill();
      }

      // Red beetle with pulsing glow
      target.pulse = (target.pulse + 0.04) % (Math.PI * 2);
      const glowR = 26 + Math.sin(target.pulse) * 6;
      const glow = ctx.createRadialGradient(target.x, target.y, 2, target.x, target.y, glowR * 2.2);
      glow.addColorStop(0, "rgba(255,77,77,0.55)");
      glow.addColorStop(1, "rgba(255,77,77,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(target.x, target.y, glowR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      drawBeetle(
        ctx,
        {
          x: target.x,
          y: target.y,
          vx: 0,
          vy: 0,
          hx: target.x,
          hy: target.y,
          a: -0.3,
          va: 0,
          size: target.size,
          shade: 0,
        },
        RED,
        1,
      );

      // Crosshair + ring
      if (lockRef.current > 0) {
        const l = lockRef.current;
        const r = 60 - l * 22;
        ctx.strokeStyle = ACID;
        ctx.globalAlpha = l;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
        ctx.stroke();
        // ticks
        ctx.beginPath();
        ctx.moveTo(target.x - r - 8, target.y);
        ctx.lineTo(target.x - r + 4, target.y);
        ctx.moveTo(target.x + r - 4, target.y);
        ctx.lineTo(target.x + r + 8, target.y);
        ctx.moveTo(target.x, target.y - r - 8);
        ctx.lineTo(target.x, target.y - r + 4);
        ctx.moveTo(target.x, target.y + r - 4);
        ctx.lineTo(target.x, target.y + r + 8);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Scanline
      if (phase === "scan") {
        const y = scanYRef.current;
        const g = ctx.createLinearGradient(0, y - 40, 0, y + 40);
        g.addColorStop(0, "rgba(197,239,87,0)");
        g.addColorStop(0.5, "rgba(197,239,87,0.55)");
        g.addColorStop(1, "rgba(197,239,87,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, y - 40, w, 80);
        ctx.fillStyle = ACID;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(0, y - 0.5, w, 1);
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    if (reduce) {
      // one frame; set to end state
      partRef.current = 1;
      dimRef.current = 1;
      spotlightRef.current = 1;
      lockRef.current = 1;
      setReadout("1,024 SCANNED · 1 CRITICAL ISOLATED");
      setShowCards(true);
      setCard1Pass(true);
      render();
      return;
    }
    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawBeetle, reduce, setPhaseBoth, showCards]);

  const play = useCallback(() => {
    if (reduce) return;
    // reset
    setShowCards(false);
    setCard1Pass(false);
    setReadout("");
    partRef.current = 0;
    dimRef.current = 0;
    spotlightRef.current = 0;
    lockRef.current = 0;
    scanYRef.current = -20;
    // reset beetle positions to home
    for (const b of beetlesRef.current) {
      b.x = b.hx;
      b.y = b.hy;
      b.vx = 0;
      b.vy = 0;
    }
    setPhaseBoth("scan");
  }, [reduce, setPhaseBoth]);

  // Auto-play once when 60% in view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= 0.6 && !hasAutoPlayedRef.current) {
            hasAutoPlayedRef.current = true;
            play();
          }
        }
      },
      { threshold: [0, 0.3, 0.6, 0.9] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play, reduce]);

  return (
    <section
      id="hunt"
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "#070708" }}
    >
      {/* faint UV edge haze */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(169,145,255,0.10),transparent_65%)] blur-3xl" />
        <div className="absolute -right-40 bottom-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(169,145,255,0.08),transparent_65%)] blur-3xl" />
      </div>

      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {/* Overlay grid */}
      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 gap-8 px-6 py-24 md:grid-cols-12 md:py-32">
        {/* Left column: copy */}
        <div className="flex flex-col justify-center md:col-span-5">
          <div className="label-mono mb-6 text-acid">Threat Detection</div>
          <h2 className="font-display text-4xl leading-[1.02] font-bold tracking-[-0.02em] text-ink md:text-6xl">
            1,024 bugs live in your code.{" "}
            <span className="italic" style={{ color: RED }}>
              One of them kills it.
            </span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-ink">
            AcidTest doesn't just generate tests. It breeds the ones that corner the killer.
          </p>
          <div className="mt-8">
            <button
              onClick={play}
              className="inline-flex items-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_32px_-6px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_48px_-4px_rgba(197,239,87,0.85)]"
            >
              <span>▶</span> Scan the swarm
            </button>
            {readout && <div className="label-mono mt-6 text-acid">{readout}</div>}
          </div>
        </div>

        {/* Right column: cards */}
        <div className="flex flex-col justify-center gap-4 md:col-span-5 md:col-start-8">
          <AnimatePresence>
            {showCards && (
              <>
                <motion.div
                  key="c1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0 }}
                  className="folder-tab p-5 pt-7"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="label-mono">BUG-0417 · Race Condition</span>
                    <motion.span
                      key={card1Pass ? "pass" : "crit"}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 340, damping: 18 }}
                      className="rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider"
                      style={
                        card1Pass
                          ? { background: ACID, color: "#0a0a0a" }
                          : { background: RED, color: "#0a0a0a" }
                      }
                    >
                      {card1Pass ? "PASS · NEUTRALIZED BY TC-047" : "CRITICAL"}
                    </motion.span>
                  </div>
                  <p className="text-[14px] leading-snug text-ink">
                    Payment double-charged on parallel retry
                  </p>
                </motion.div>

                <motion.div
                  key="c2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.18 }}
                  className="folder-tab p-5 pt-7"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="label-mono">TC-047 · P0</span>
                    <span className="rounded bg-acid px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#0a0a0a]">
                      GENERATED
                    </span>
                  </div>
                  <p className="text-[14px] leading-snug text-ink">
                    Idempotency key rejects duplicate charge attempts
                  </p>
                </motion.div>

                <motion.div
                  key="c3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.36 }}
                  className="folder-tab p-5 pt-7"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="label-mono">TC-048 · P1</span>
                    <span className="rounded bg-acid px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#0a0a0a]">
                      GENERATED
                    </span>
                  </div>
                  <p className="text-[14px] leading-snug text-ink">
                    Retry storm resolves to exactly one ledger entry
                  </p>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
