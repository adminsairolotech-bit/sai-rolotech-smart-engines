import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const PROFILES = [
  {
    id: "c-purlin", label: "C-Purlin", x: 40, y: 30,
    path: "M 70,8 L 8,8 L 8,52 L 70,52",
    dims: [{ x1: 8, y1: 2, x2: 70, y2: 2, label: "W", lx: 39, ly: 0 }, { x1: 2, y1: 8, x2: 2, y2: 52, label: "H", lx: -4, ly: 30 }],
  },
  {
    id: "z-purlin", label: "Z-Purlin", x: 180, y: 30,
    path: "M 8,8 L 45,8 L 45,32 L 80,32 L 80,56",
    dims: [{ x1: 8, y1: 2, x2: 80, y2: 2, label: "W", lx: 44, ly: 0 }],
  },
  {
    id: "u-channel", label: "U-Channel", x: 330, y: 30,
    path: "M 8,8 L 8,56 L 72,56 L 72,8",
    dims: [{ x1: 8, y1: 62, x2: 72, y2: 62, label: "W", lx: 40, ly: 68 }],
  },
  {
    id: "hat", label: "Hat Profile", x: 480, y: 30,
    path: "M 8,52 L 8,28 L 24,8 L 56,8 L 72,28 L 72,52",
    dims: [{ x1: 8, y1: 58, x2: 72, y2: 58, label: "W", lx: 40, ly: 66 }],
  },
  {
    id: "l-angle", label: "L-Angle", x: 40, y: 155,
    path: "M 8,8 L 8,60 L 60,60",
    dims: [{ x1: 2, y1: 8, x2: 2, y2: 60, label: "H", lx: -4, ly: 34 }],
  },
  {
    id: "t-section", label: "T-Section", x: 180, y: 155,
    path: "M 8,8 L 72,8 M 40,8 L 40,60",
    dims: [{ x1: 8, y1: 2, x2: 72, y2: 2, label: "W", lx: 40, ly: 0 }],
  },
  {
    id: "omega", label: "Omega", x: 330, y: 155,
    path: "M 8,52 L 18,52 L 18,24 L 30,8 L 50,8 L 62,24 L 62,52 L 72,52",
    dims: [{ x1: 8, y1: 58, x2: 72, y2: 58, label: "W", lx: 40, ly: 66 }],
  },
  {
    id: "roof", label: "Roofing Sheet", x: 480, y: 155,
    path: "M 8,52 L 8,32 L 20,16 L 32,32 L 44,16 L 56,32 L 68,16 L 80,32 L 80,52",
    dims: [{ x1: 8, y1: 58, x2: 80, y2: 58, label: "W", lx: 44, ly: 66 }],
  },
  {
    id: "floor", label: "Floor Deck", x: 40, y: 275,
    path: "M 8,52 L 8,32 L 24,8 L 40,32 L 56,8 L 72,32 L 72,52",
    dims: [],
  },
  {
    id: "track", label: "Track", x: 180, y: 275,
    path: "M 8,8 L 8,52 L 72,52 L 72,8 M 20,52 L 20,36 M 60,52 L 60,36",
    dims: [],
  },
  {
    id: "solar", label: "Solar Frame", x: 330, y: 275,
    path: "M 8,8 L 72,8 L 72,56 L 8,56 L 8,8 M 8,32 L 72,32 M 40,8 L 40,32",
    dims: [],
  },
  {
    id: "cable", label: "Cable Tray", x: 480, y: 275,
    path: "M 8,16 L 8,52 L 72,52 L 72,16 M 20,16 L 8,8 M 60,16 L 72,8 M 8,52 L 20,60 M 72,52 L 60,60",
    dims: [],
  },
];

const GRID_SIZE = 20;

function DrawingGrid({ w, h }: { w: number; h: number }) {
  const cols = Math.floor(w / GRID_SIZE);
  const rows = Math.floor(h / GRID_SIZE);
  return (
    <g opacity="0.18">
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <line key={`v${i}`} x1={i * GRID_SIZE} y1={0} x2={i * GRID_SIZE} y2={h} stroke="#2563eb" strokeWidth="0.4" />
      ))}
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * GRID_SIZE} x2={w} y2={i * GRID_SIZE} stroke="#2563eb" strokeWidth="0.4" />
      ))}
    </g>
  );
}

export default function SplashPage() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<"grid" | "profiles" | "labels" | "brand" | "out">("grid");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("profiles"), 400);
    const t2 = setTimeout(() => setPhase("labels"), 1800);
    const t3 = setTimeout(() => setPhase("brand"), 2600);
    const t4 = setTimeout(() => setPhase("out"), 4000);
    const alreadyOnboarded = localStorage.getItem("sai_crm_onboarded") === "true";
    const t5 = setTimeout(() => setLocation(alreadyOnboarded ? "/login" : "/onboarding"), 4500);
    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
  }, [setLocation]);

  const W = 700, H = 420;

  return (
    <AnimatePresence>
      {phase !== "out" ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden"
          style={{ background: "linear-gradient(160deg, #f8faff 0%, #eef4ff 50%, #f3f0ff 100%)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-200/60 border border-blue-100"
            style={{ background: "#fafcff", width: W, maxWidth: "96vw" }}
          >
            <svg
              width={W} height={H}
              viewBox={`0 0 ${W} ${H}`}
              style={{ display: "block" }}
            >
              {/* Grid */}
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <DrawingGrid w={W} h={H} />
              </motion.g>

              {/* Border frame — technical drawing border */}
              <rect x="10" y="10" width={W - 20} height={H - 20} fill="none" stroke="#2563eb" strokeWidth="1.5" opacity="0.5" />
              <rect x="14" y="14" width={W - 28} height={H - 28} fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.3" />

              {/* Section dividers */}
              <line x1="14" y1={H - 56} x2={W - 14} y2={H - 56} stroke="#2563eb" strokeWidth="0.7" opacity="0.4" />
              <line x1="14" y1={H - 80} x2={W - 14} y2={H - 80} stroke="#2563eb" strokeWidth="0.4" opacity="0.25" />
              <line x1="160" y1={H - 56} x2="160" y2={H - 10} stroke="#2563eb" strokeWidth="0.7" opacity="0.4" />
              <line x1="360" y1={H - 56} x2="360" y2={H - 10} stroke="#2563eb" strokeWidth="0.7" opacity="0.4" />

              {/* Title block text — bottom */}
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: phase === "brand" || phase === "out" ? 1 : 0 }} transition={{ duration: 0.5 }}>
                <text x="24" y={H - 62} fontFamily="monospace" fontSize="8" fill="#1d4ed8" opacity="0.6" fontWeight="bold">TITLE</text>
                <text x="24" y={H - 38} fontFamily="monospace" fontSize="11" fill="#1e3a8a" fontWeight="bold">SAI ROLOTECH DESIGN ENGINE</text>
                <text x="24" y={H - 24} fontFamily="monospace" fontSize="8" fill="#2563eb" opacity="0.7">ROLL FORMING PROFILE LIBRARY — STANDARD CROSS-SECTIONS</text>

                <text x="172" y={H - 62} fontFamily="monospace" fontSize="8" fill="#1d4ed8" opacity="0.6">DRAWN BY</text>
                <text x="172" y={H - 46} fontFamily="monospace" fontSize="9" fill="#1e3a8a">AI DESIGN ENGINE</text>
                <text x="172" y={H - 62 + 30} fontFamily="monospace" fontSize="8" fill="#1d4ed8" opacity="0.6">DATE</text>
                <text x="172" y={H - 62 + 42} fontFamily="monospace" fontSize="9" fill="#1e3a8a">{new Date().toLocaleDateString("en-IN")}</text>

                <text x="372" y={H - 62} fontFamily="monospace" fontSize="8" fill="#1d4ed8" opacity="0.6">SCALE</text>
                <text x="372" y={H - 46} fontFamily="monospace" fontSize="9" fill="#1e3a8a">1:10</text>
                <text x="450" y={H - 62} fontFamily="monospace" fontSize="8" fill="#1d4ed8" opacity="0.6">SHEET</text>
                <text x="450" y={H - 46} fontFamily="monospace" fontSize="9" fill="#1e3a8a">01 OF 01</text>
                <text x="530" y={H - 62} fontFamily="monospace" fontSize="8" fill="#1d4ed8" opacity="0.6">DWG NO.</text>
                <text x="530" y={H - 46} fontFamily="monospace" fontSize="9" fill="#1e3a8a">SRT-2025-001</text>
              </motion.g>

              {/* Profiles */}
              {PROFILES.map((p, i) => (
                <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
                  {/* Profile box */}
                  <rect x="0" y="0" width="100" height="82" fill="none" stroke="#93c5fd" strokeWidth="0.4" opacity="0.4" />

                  {/* The drawing path */}
                  <motion.path
                    d={p.path}
                    stroke="#1d4ed8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: phase === "grid" ? 0 : 1,
                      opacity: phase === "grid" ? 0 : 1,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: "easeInOut",
                      delay: phase !== "grid" ? i * 0.08 : 0,
                    }}
                  />

                  {/* Center cross-hatch fill */}
                  <motion.path
                    d={p.path}
                    stroke="#3b82f6"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.08"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: phase === "grid" ? 0 : 1,
                      opacity: phase === "grid" ? 0 : 1,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: "easeInOut",
                      delay: phase !== "grid" ? i * 0.08 : 0,
                    }}
                  />

                  {/* Dimension lines */}
                  {p.dims.map((d, di) => (
                    <motion.g key={di}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: phase === "labels" || phase === "brand" ? 1 : 0 }}
                      transition={{ duration: 0.3, delay: di * 0.1 }}
                    >
                      <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="#60a5fa" strokeWidth="0.6" />
                      <polygon points={`${d.x1 - 2},${d.y1} ${d.x1 + 4},${d.y1 - 2} ${d.x1 + 4},${d.y1 + 2}`} fill="#60a5fa" transform={`rotate(${d.y1 === d.y2 ? 0 : 90}, ${d.x1}, ${d.y1})`} />
                      <polygon points={`${d.x2 + 2},${d.y2} ${d.x2 - 4},${d.y2 - 2} ${d.x2 - 4},${d.y2 + 2}`} fill="#60a5fa" transform={`rotate(${d.y1 === d.y2 ? 0 : 90}, ${d.x2}, ${d.y2})`} />
                      <text x={d.lx} y={d.ly + 4} fontFamily="monospace" fontSize="7" fill="#2563eb" textAnchor="middle">{d.label}</text>
                    </motion.g>
                  ))}

                  {/* Profile label */}
                  <motion.text
                    x="50" y="88"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontSize="7.5"
                    fontWeight="bold"
                    fill="#1e40af"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: phase === "labels" || phase === "brand" ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    {p.label}
                  </motion.text>

                  {/* Profile number */}
                  <motion.text
                    x="96" y="8"
                    textAnchor="end"
                    fontFamily="monospace"
                    fontSize="6"
                    fill="#93c5fd"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: phase === "labels" || phase === "brand" ? 0.7 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {(i + 1).toString().padStart(2, "0")}
                  </motion.text>
                </g>
              ))}

              {/* Center brand overlay */}
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: phase === "brand" ? 1 : 0,
                  scale: phase === "brand" ? 1 : 0.8,
                }}
                transition={{ duration: 0.5, type: "spring" }}
                style={{ transformOrigin: `${W / 2}px ${H / 2 - 60}px` }}
              >
                <rect
                  x={W / 2 - 130} y={H / 2 - 110}
                  width="260" height="80"
                  rx="12"
                  fill="white" fillOpacity="0.92"
                  stroke="#3b82f6" strokeWidth="1"
                  style={{ filter: "drop-shadow(0 4px 24px rgba(59,130,246,0.2))" }}
                />
                <text x={W / 2} y={H / 2 - 72} textAnchor="middle" fontFamily="sans-serif" fontSize="18" fontWeight="bold" fill="#1e3a8a">SAI RoloTech</text>
                <text x={W / 2} y={H / 2 - 50} textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#3b82f6" fontWeight="bold">DESIGN ENGINE · 92% ACCURACY · 500+ PROFILES</text>
              </motion.g>

              {/* Animated drawing cursor/pen dot */}
              {phase === "profiles" && (
                <motion.g
                  initial={{ x: 40, y: 60 }}
                  animate={{ x: [40, 200, 380, 540, 40, 200, 380, 540], y: [60, 60, 60, 60, 220, 220, 220, 220] }}
                  transition={{ duration: 1.4, ease: "linear" }}
                >
                  <circle r="4" fill="#3b82f6" opacity="0.7" />
                  <circle r="8" fill="#3b82f6" opacity="0.2" />
                </motion.g>
              )}
            </svg>

            {/* Loading bar at bottom */}
            <div className="h-1 bg-blue-50">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)" }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.2, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
