import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import beetle from "@/assets/beetle.png";

type TC = { id: string; prio: string; title: string };

const CASES: TC[] = [
  { id: "TC-001", prio: "P0", title: "Valid email receives password-reset link" },
  {
    id: "TC-002",
    prio: "P0",
    title: "Invalid email returns generic success — no account enumeration",
  },
  { id: "TC-003", prio: "P1", title: "Reset link rejected after 60-minute expiry" },
];

export function Hero() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [6, -6]), { stiffness: 80, damping: 15 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-6, 6]), { stiffness: 80, damping: 15 });

  const [scanning, setScanning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<"CONTAINED" | "DONE">("CONTAINED");

  useEffect(() => {
    // reveal cards on mount for baseline
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }

  function runAcidTest() {
    setRevealed(false);
    setStatus("CONTAINED");
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setRevealed(true);
      setStatus("DONE");
    }, 1800);
  }

  return (
    <section
      onMouseMove={onMove}
      className="relative overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32"
    >
      {/* split glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[900px] w-[900px] -translate-x-[95%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(169,145,255,0.22),transparent_60%)] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[900px] w-[900px] -translate-x-[5%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(197,239,87,0.18),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,#070708_80%)]" />
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-8">
        {/* Left copy */}
        <div className="md:col-span-4 md:pt-12">
          <div className="label-mono mb-6 text-acid">
            Specimen BUG-001 · Class: Production Defect
          </div>
          <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-[-0.02em] text-ink md:text-6xl">
            Every bug
            <br />
            meets its
            <br />
            <span className="italic text-acid">acid test.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-ink">
            Paste a user story. AcidTest breeds the scenarios, edge cases and ready-to-run suites
            that hunt the bug down — in seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={runAcidTest}
              className="group inline-flex items-center gap-2 rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_32px_-6px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_48px_-4px_rgba(197,239,87,0.85)]"
            >
              <span>▶</span> Run the Acid Test
            </button>
            <a
              href="#protocol"
              className="inline-flex items-center rounded-md border border-white/10 bg-[rgba(19,20,22,0.6)] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-ink backdrop-blur transition-colors hover:border-acid/40 hover:text-acid"
            >
              View Documentation
            </a>
          </div>
        </div>

        {/* Beetle */}
        <div className="relative md:col-span-4 md:min-h-[520px]">
          <motion.div
            style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
            className="relative mx-auto flex h-full items-center justify-center"
          >
            <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,rgba(197,239,87,0.25),transparent_65%)] blur-2xl" />
            <img
              src={beetle}
              alt="Iridescent jewel beetle specimen"
              width={520}
              height={520}
              className="relative w-[92%] max-w-[520px] drop-shadow-[0_20px_80px_rgba(197,239,87,0.25)]"
              style={{
                maskImage: "radial-gradient(circle at 50% 50%, black 60%, transparent 92%)",
                WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 60%, transparent 92%)",
              }}
            />
            {/* Scan overlay */}
            {scanning && !reduce && (
              <>
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: "100%" }}
                  transition={{ duration: 1.6, ease: "easeInOut" }}
                  className="absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-acid to-transparent shadow-[0_0_40px_10px_rgba(197,239,87,0.6)]"
                />
                <motion.div
                  initial={{ scale: 0.3, opacity: 0.9 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-acid"
                />
              </>
            )}
            {/* Status readout */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-hairline bg-[rgba(7,7,8,0.85)] px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase">
              <span className="text-muted-ink">Status:</span>{" "}
              {status === "CONTAINED" ? (
                <span className="text-uv">Contained</span>
              ) : (
                <span className="text-acid">12 Tests Generated · 0 Bugs Survived</span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right cards */}
        <div className="flex flex-col gap-4 md:col-span-4 md:pt-4">
          {CASES.map((tc, i) => (
            <motion.div
              key={tc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.45, delay: revealed ? i * 0.12 : 0 }}
              className="folder-tab p-5 pt-7"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="label-mono text-muted-ink">
                  {tc.id} · {tc.prio}
                </span>
                <span className="rounded bg-acid/90 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#0a0a0a]">
                  PASS
                </span>
              </div>
              <p className="text-[14px] leading-snug text-ink">{tc.title}</p>
            </motion.div>
          ))}
          <div className="pl-1 label-mono text-muted-ink">
            → +9 more · exported to <span className="text-acid">playwright.spec.ts</span>
          </div>
        </div>
      </div>
    </section>
  );
}
