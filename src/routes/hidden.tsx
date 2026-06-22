import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Fireworks } from "@/components/Fireworks";

export const Route = createFileRoute("/hidden")({
  component: HiddenObjectsGame,
  head: () => ({
    meta: [
      { title: "إيجاد الأشياء المفقودة — Hidden Objects" },
      { name: "description", content: "Kids hidden-objects coloring game." },
    ],
  }),
});

// ---------- progress persistence ----------
const STORAGE_KEY = "kid_hidden_completed";
function loadCompleted(): Record<number, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCompleted(c: Record<number, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {}
}

// ---------- sound ----------
function playPop() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.22);
  } catch {}
}

// ---------- shared style ----------
const OUTLINE = {
  fill: "#fff",
  stroke: "#111",
  strokeWidth: 2.5,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

type Target = { id: string; name: string; nameAr: string };

type Level = {
  id: number;
  title: string;
  titleAr: string;
  bg: (props: { found: Record<string, boolean>; onTap: (id: string) => void }) => React.ReactNode;
  targets: Target[];
  itemColors: Record<string, string>;
};

// ---------- interactive item wrapper (lenient hitbox) ----------
function Item({
  id,
  found,
  onTap,
  children,
  hit, // {x,y,w,h} optional bigger hitbox
  color,
}: {
  id: string;
  found: boolean;
  onTap: (id: string) => void;
  children: (filled: boolean, color: string) => React.ReactNode;
  hit?: { x: number; y: number; w: number; h: number };
  color: string;
}) {
  return (
    <g
      style={{ cursor: found ? "default" : "pointer" }}
      onClick={() => !found && onTap(id)}
    >
      {children(found, color)}
      {hit && !found && (
        <rect
          x={hit.x}
          y={hit.y}
          width={hit.w}
          height={hit.h}
          fill="transparent"
        />
      )}
    </g>
  );
}

// ============================================================
// LEVEL 1 — BATHROOM
// ============================================================
function BathroomScene({
  found,
  onTap,
}: {
  found: Record<string, boolean>;
  onTap: (id: string) => void;
}) {
  return (
    <svg viewBox="0 0 800 520" className="h-full w-full">
      {/* walls + floor */}
      <rect x="0" y="0" width="800" height="380" {...OUTLINE} fill="#fafafa" />
      <rect x="0" y="380" width="800" height="140" {...OUTLINE} fill="#f3f3f3" />
      {/* tiles */}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1={i * 90} y1="380" x2={i * 90} y2="520" stroke="#111" strokeWidth="1.5" />
      ))}
      {/* shelves */}
      <line x1="60" y1="120" x2="740" y2="120" stroke="#111" strokeWidth="3" />
      <line x1="60" y1="240" x2="740" y2="240" stroke="#111" strokeWidth="3" />
      {/* mirror */}
      <rect x="320" y="30" width="160" height="80" rx="10" {...OUTLINE} />
      {/* sink */}
      <path d="M 280 380 Q 400 320 520 380 Z" {...OUTLINE} />
      {/* towel */}
      <rect x="620" y="150" width="90" height="80" rx="6" {...OUTLINE} />
      <line x1="620" y1="170" x2="710" y2="170" stroke="#111" strokeWidth="1.5" />

      {/* ---- targets ---- */}
      {/* blue bottle */}
      <Item id="bottle" found={!!found.bottle} onTap={onTap} color="#2563eb"
        hit={{ x: 80, y: 60, w: 70, h: 70 }}>
        {(f, c) => (
          <>
            <rect x="100" y="80" width="30" height="14" rx="3" {...OUTLINE} fill={f ? "#1e3a8a" : "#fff"} />
            <rect x="95" y="94" width="40" height="30" rx="6" {...OUTLINE} fill={f ? c : "#fff"} />
          </>
        )}
      </Item>
      {/* pink soap */}
      <Item id="soap" found={!!found.soap} onTap={onTap} color="#ec4899"
        hit={{ x: 200, y: 60, w: 80, h: 70 }}>
        {(f, c) => (
          <ellipse cx="240" cy="100" rx="34" ry="20" {...OUTLINE} fill={f ? c : "#fff"} />
        )}
      </Item>
      {/* yellow duck */}
      <Item id="duck" found={!!found.duck} onTap={onTap} color="#facc15"
        hit={{ x: 360, y: 200, w: 90, h: 60 }}>
        {(f, c) => (
          <>
            <ellipse cx="400" cy="235" rx="34" ry="18" {...OUTLINE} fill={f ? c : "#fff"} />
            <circle cx="425" cy="218" r="14" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 437 218 l 12 -2 l -12 8 z" {...OUTLINE} fill={f ? "#f97316" : "#fff"} />
            <circle cx="428" cy="215" r="2" fill="#111" />
          </>
        )}
      </Item>
      {/* green toothbrush */}
      <Item id="brush" found={!!found.brush} onTap={onTap} color="#22c55e"
        hit={{ x: 540, y: 60, w: 90, h: 70 }}>
        {(f, c) => (
          <>
            <rect x="555" y="100" width="70" height="10" rx="3" {...OUTLINE} fill={f ? c : "#fff"} />
            <rect x="555" y="92" width="20" height="8" rx="1" {...OUTLINE} fill={f ? "#fff" : "#fff"} stroke="#111" />
          </>
        )}
      </Item>
      {/* red towel */}
      <Item id="towel" found={!!found.towel} onTap={onTap} color="#ef4444"
        hit={{ x: 615, y: 145, w: 100, h: 90 }}>
        {(f, c) => (
          <rect x="620" y="150" width="90" height="80" rx="6" {...OUTLINE} fill={f ? c : "transparent"} />
        )}
      </Item>
    </svg>
  );
}

// ============================================================
// LEVEL 2 — MOSQUE
// ============================================================
function MosqueScene({ found, onTap }: any) {
  return (
    <svg viewBox="0 0 800 520" className="h-full w-full">
      <rect x="0" y="0" width="800" height="520" fill="#fafafa" stroke="#111" strokeWidth="2" />
      {/* arch windows */}
      {[120, 320, 520].map((x, i) => (
        <path key={i} d={`M ${x} 200 V 90 Q ${x + 80} 30 ${x + 160} 90 V 200 Z`} {...OUTLINE} />
      ))}
      {/* floor */}
      <line x1="0" y1="380" x2="800" y2="380" stroke="#111" strokeWidth="3" />

      {/* prayer rug (target) */}
      <Item id="rug" found={!!found.rug} onTap={onTap} color="#dc2626"
        hit={{ x: 60, y: 380, w: 220, h: 120 }}>
        {(f, c) => (
          <>
            <rect x="80" y="400" width="180" height="90" rx="6" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d={`M 170 410 V 460 M 130 440 H 210`} stroke={f ? "#fff" : "#111"} strokeWidth="2" fill="none" />
          </>
        )}
      </Item>

      {/* minbar */}
      <Item id="minbar" found={!!found.minbar} onTap={onTap} color="#92400e"
        hit={{ x: 340, y: 240, w: 160, h: 160 }}>
        {(f, c) => (
          <>
            <path d="M 360 380 V 280 L 420 260 V 380 Z" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 420 380 V 260 L 480 250 V 380 Z" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 420 260 Q 450 230 480 250" {...OUTLINE} fill="none" />
          </>
        )}
      </Item>

      {/* chandelier */}
      <Item id="chandelier" found={!!found.chandelier} onTap={onTap} color="#eab308"
        hit={{ x: 360, y: 0, w: 120, h: 90 }}>
        {(f, c) => (
          <>
            <line x1="420" y1="0" x2="420" y2="30" stroke="#111" strokeWidth="2" />
            <circle cx="420" cy="55" r="22" {...OUTLINE} fill={f ? c : "#fff"} />
            <line x1="400" y1="70" x2="395" y2="85" stroke="#111" strokeWidth="2" />
            <line x1="420" y1="78" x2="420" y2="92" stroke="#111" strokeWidth="2" />
            <line x1="440" y1="70" x2="445" y2="85" stroke="#111" strokeWidth="2" />
          </>
        )}
      </Item>

      {/* quran book */}
      <Item id="quran" found={!!found.quran} onTap={onTap} color="#16a34a"
        hit={{ x: 580, y: 380, w: 160, h: 90 }}>
        {(f, c) => (
          <>
            <rect x="600" y="410" width="120" height="60" rx="4" {...OUTLINE} fill={f ? c : "#fff"} />
            <line x1="660" y1="410" x2="660" y2="470" stroke="#111" strokeWidth="2" />
          </>
        )}
      </Item>
    </svg>
  );
}

// ============================================================
// LEVEL 3 — POLICE STATION
// ============================================================
function PoliceScene({ found, onTap }: any) {
  return (
    <svg viewBox="0 0 800 520" className="h-full w-full">
      <rect x="0" y="0" width="800" height="520" fill="#fafafa" stroke="#111" strokeWidth="2" />
      {/* window */}
      <rect x="40" y="40" width="220" height="140" {...OUTLINE} />
      <line x1="150" y1="40" x2="150" y2="180" stroke="#111" strokeWidth="2" />
      <line x1="40" y1="110" x2="260" y2="110" stroke="#111" strokeWidth="2" />
      {/* desk */}
      <rect x="60" y="340" width="380" height="40" {...OUTLINE} />
      <rect x="80" y="380" width="20" height="120" {...OUTLINE} />
      <rect x="400" y="380" width="20" height="120" {...OUTLINE} />

      {/* police car (outside window) */}
      <Item id="car" found={!!found.car} onTap={onTap} color="#1d4ed8"
        hit={{ x: 50, y: 70, w: 200, h: 110 }}>
        {(f, c) => (
          <>
            <rect x="70" y="120" width="180" height="40" rx="6" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 100 120 L 120 90 H 200 L 220 120 Z" {...OUTLINE} fill={f ? c : "#fff"} />
            <circle cx="110" cy="165" r="14" {...OUTLINE} fill="#222" />
            <circle cx="210" cy="165" r="14" {...OUTLINE} fill="#222" />
            <rect x="150" y="80" width="20" height="12" rx="2" {...OUTLINE} fill={f ? "#ef4444" : "#fff"} />
          </>
        )}
      </Item>

      {/* badge */}
      <Item id="badge" found={!!found.badge} onTap={onTap} color="#eab308"
        hit={{ x: 470, y: 110, w: 110, h: 110 }}>
        {(f, c) => (
          <path d="M 525 130 L 545 150 L 575 155 L 555 180 L 560 210 L 525 195 L 490 210 L 495 180 L 475 155 L 505 150 Z"
            {...OUTLINE} fill={f ? c : "#fff"} />
        )}
      </Item>

      {/* walkie-talkie */}
      <Item id="walkie" found={!!found.walkie} onTap={onTap} color="#111"
        hit={{ x: 620, y: 110, w: 100, h: 200 }}>
        {(f, c) => (
          <>
            <rect x="640" y="140" width="60" height="160" rx="6" {...OUTLINE} fill={f ? c : "#fff"} />
            <line x1="660" y1="140" x2="660" y2="100" stroke="#111" strokeWidth="3" />
            <circle cx="660" cy="100" r="5" {...OUTLINE} fill={f ? "#ef4444" : "#fff"} />
            <rect x="655" y="175" width="30" height="22" rx="3" {...OUTLINE} fill={f ? "#22c55e" : "#fff"} />
          </>
        )}
      </Item>

      {/* coffee cup on desk */}
      <Item id="cup" found={!!found.cup} onTap={onTap} color="#b45309"
        hit={{ x: 200, y: 290, w: 90, h: 70 }}>
        {(f, c) => (
          <>
            <path d="M 220 310 H 270 V 340 Q 245 360 220 340 Z" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 270 318 Q 290 318 290 332 Q 290 346 270 346" {...OUTLINE} fill="none" />
          </>
        )}
      </Item>
    </svg>
  );
}

// ============================================================
// LEVEL 4 — FIRE STATION
// ============================================================
function FireScene({ found, onTap }: any) {
  return (
    <svg viewBox="0 0 800 520" className="h-full w-full">
      <rect x="0" y="0" width="800" height="520" fill="#fafafa" stroke="#111" strokeWidth="2" />
      <line x1="0" y1="420" x2="800" y2="420" stroke="#111" strokeWidth="3" />

      {/* fire truck */}
      <Item id="truck" found={!!found.truck} onTap={onTap} color="#dc2626"
        hit={{ x: 60, y: 250, w: 360, h: 200 }}>
        {(f, c) => (
          <>
            <rect x="80" y="320" width="320" height="90" rx="8" {...OUTLINE} fill={f ? c : "#fff"} />
            <rect x="80" y="270" width="100" height="50" rx="6" {...OUTLINE} fill={f ? c : "#fff"} />
            <rect x="95" y="280" width="70" height="30" {...OUTLINE} fill={f ? "#bfdbfe" : "#fff"} />
            <circle cx="140" cy="425" r="22" {...OUTLINE} fill="#222" />
            <circle cx="340" cy="425" r="22" {...OUTLINE} fill="#222" />
            <circle cx="220" cy="290" r="6" {...OUTLINE} fill={f ? "#fde047" : "#fff"} />
          </>
        )}
      </Item>

      {/* helmet */}
      <Item id="helmet" found={!!found.helmet} onTap={onTap} color="#f59e0b"
        hit={{ x: 470, y: 250, w: 140, h: 100 }}>
        {(f, c) => (
          <>
            <path d="M 490 330 Q 540 250 590 330 Z" {...OUTLINE} fill={f ? c : "#fff"} />
            <rect x="480" y="328" width="120" height="14" rx="4" {...OUTLINE} fill={f ? c : "#fff"} />
          </>
        )}
      </Item>

      {/* ladder */}
      <Item id="ladder" found={!!found.ladder} onTap={onTap} color="#a16207"
        hit={{ x: 640, y: 100, w: 110, h: 320 }}>
        {(f, c) => (
          <>
            <line x1="660" y1="120" x2="660" y2="420" stroke={f ? c : "#111"} strokeWidth="6" />
            <line x1="720" y1="120" x2="720" y2="420" stroke={f ? c : "#111"} strokeWidth="6" />
            {[150, 200, 250, 300, 350, 400].map((y) => (
              <line key={y} x1="660" y1={y} x2="720" y2={y} stroke={f ? c : "#111"} strokeWidth="5" />
            ))}
          </>
        )}
      </Item>

      {/* hydrant */}
      <Item id="hydrant" found={!!found.hydrant} onTap={onTap} color="#dc2626"
        hit={{ x: 440, y: 360, w: 70, h: 80 }}>
        {(f, c) => (
          <>
            <rect x="455" y="380" width="40" height="40" rx="6" {...OUTLINE} fill={f ? c : "#fff"} />
            <rect x="465" y="368" width="20" height="14" rx="3" {...OUTLINE} fill={f ? c : "#fff"} />
            <circle cx="450" cy="395" r="6" {...OUTLINE} fill={f ? c : "#fff"} />
            <circle cx="500" cy="395" r="6" {...OUTLINE} fill={f ? c : "#fff"} />
          </>
        )}
      </Item>
    </svg>
  );
}

// ============================================================
// LEVEL 5 — SCHOOL
// ============================================================
function SchoolScene({ found, onTap }: any) {
  return (
    <svg viewBox="0 0 800 520" className="h-full w-full">
      <rect x="0" y="0" width="800" height="520" fill="#fafafa" stroke="#111" strokeWidth="2" />
      {/* blackboard */}
      <Item id="board" found={!!found.board} onTap={onTap} color="#166534"
        hit={{ x: 60, y: 40, w: 460, h: 220 }}>
        {(f, c) => (
          <>
            <rect x="80" y="60" width="420" height="200" rx="6" {...OUTLINE} fill={f ? c : "#fff"} />
            <text x="290" y="170" textAnchor="middle" fontSize="48" fill={f ? "#fff" : "#111"} fontFamily="serif">ABC</text>
          </>
        )}
      </Item>
      <line x1="0" y1="380" x2="800" y2="380" stroke="#111" strokeWidth="3" />

      {/* desk */}
      <rect x="80" y="400" width="180" height="20" {...OUTLINE} />
      <rect x="90" y="420" width="14" height="80" {...OUTLINE} />
      <rect x="240" y="420" width="14" height="80" {...OUTLINE} />

      {/* backpack */}
      <Item id="bag" found={!!found.bag} onTap={onTap} color="#7c3aed"
        hit={{ x: 540, y: 290, w: 150, h: 200 }}>
        {(f, c) => (
          <>
            <rect x="560" y="320" width="110" height="150" rx="20" {...OUTLINE} fill={f ? c : "#fff"} />
            <rect x="585" y="370" width="60" height="40" rx="6" {...OUTLINE} fill={f ? "#fff" : "#fff"} stroke="#111" />
            <path d="M 575 320 Q 575 290 615 290 Q 655 290 655 320" {...OUTLINE} fill="none" />
          </>
        )}
      </Item>

      {/* pencil */}
      <Item id="pencil" found={!!found.pencil} onTap={onTap} color="#f59e0b"
        hit={{ x: 95, y: 390, w: 160, h: 30 }}>
        {(f, c) => (
          <>
            <rect x="110" y="394" width="120" height="12" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 230 394 L 250 400 L 230 406 Z" {...OUTLINE} fill={f ? "#fde68a" : "#fff"} />
            <path d="M 250 400 L 254 400" stroke="#111" strokeWidth="3" />
            <rect x="100" y="394" width="14" height="12" {...OUTLINE} fill={f ? "#ef4444" : "#fff"} />
          </>
        )}
      </Item>

      {/* globe */}
      <Item id="globe" found={!!found.globe} onTap={onTap} color="#3b82f6"
        hit={{ x: 300, y: 290, w: 140, h: 150 }}>
        {(f, c) => (
          <>
            <circle cx="370" cy="350" r="50" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 340 320 Q 370 360 400 320 M 330 350 H 410 M 340 380 Q 370 340 400 380"
              stroke={f ? "#fff" : "#111"} strokeWidth="2" fill="none" />
            <line x1="370" y1="400" x2="370" y2="430" stroke="#111" strokeWidth="3" />
            <rect x="350" y="430" width="40" height="10" {...OUTLINE} />
          </>
        )}
      </Item>
    </svg>
  );
}

// ============================================================
// LEVEL 6 — ZOO
// ============================================================
function ZooScene({ found, onTap }: any) {
  return (
    <svg viewBox="0 0 800 520" className="h-full w-full">
      <rect x="0" y="0" width="800" height="520" fill="#fafafa" stroke="#111" strokeWidth="2" />
      <line x1="0" y1="420" x2="800" y2="420" stroke="#111" strokeWidth="3" />
      {/* tree */}
      <path d="M 700 420 V 320" stroke="#111" strokeWidth="6" />
      <circle cx="700" cy="290" r="50" {...OUTLINE} />

      {/* cage bars */}
      <rect x="30" y="100" width="220" height="320" {...OUTLINE} />
      {[60, 100, 140, 180, 220].map((x) => (
        <line key={x} x1={x} y1="100" x2={x} y2="420" stroke="#111" strokeWidth="2" />
      ))}

      {/* monkey (in cage) */}
      <Item id="monkey" found={!!found.monkey} onTap={onTap} color="#92400e"
        hit={{ x: 60, y: 240, w: 170, h: 180 }}>
        {(f, c) => (
          <>
            <circle cx="140" cy="320" r="35" {...OUTLINE} fill={f ? c : "#fff"} />
            <circle cx="140" cy="330" r="20" {...OUTLINE} fill={f ? "#fde68a" : "#fff"} />
            <circle cx="125" cy="315" r="4" fill="#111" />
            <circle cx="155" cy="315" r="4" fill="#111" />
            <circle cx="105" cy="305" r="10" {...OUTLINE} fill={f ? c : "#fff"} />
            <circle cx="175" cy="305" r="10" {...OUTLINE} fill={f ? c : "#fff"} />
          </>
        )}
      </Item>

      {/* giraffe */}
      <Item id="giraffe" found={!!found.giraffe} onTap={onTap} color="#eab308"
        hit={{ x: 320, y: 120, w: 160, h: 300 }}>
        {(f, c) => (
          <>
            <rect x="340" y="320" width="100" height="80" rx="10" {...OUTLINE} fill={f ? c : "#fff"} />
            <rect x="420" y="160" width="22" height="170" {...OUTLINE} fill={f ? c : "#fff"} />
            <circle cx="440" cy="150" r="20" {...OUTLINE} fill={f ? c : "#fff"} />
            <line x1="350" y1="400" x2="350" y2="420" stroke="#111" strokeWidth="4" />
            <line x1="380" y1="400" x2="380" y2="420" stroke="#111" strokeWidth="4" />
            <line x1="410" y1="400" x2="410" y2="420" stroke="#111" strokeWidth="4" />
            <line x1="430" y1="400" x2="430" y2="420" stroke="#111" strokeWidth="4" />
            <circle cx="360" cy="345" r="5" fill={f ? "#92400e" : "#fff"} stroke="#111" />
            <circle cx="395" cy="365" r="5" fill={f ? "#92400e" : "#fff"} stroke="#111" />
          </>
        )}
      </Item>

      {/* elephant */}
      <Item id="elephant" found={!!found.elephant} onTap={onTap} color="#6b7280"
        hit={{ x: 500, y: 280, w: 200, h: 150 }}>
        {(f, c) => (
          <>
            <ellipse cx="590" cy="370" rx="80" ry="45" {...OUTLINE} fill={f ? c : "#fff"} />
            <circle cx="520" cy="355" r="35" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 495 365 Q 470 400 490 415 Q 500 405 495 390" {...OUTLINE} fill={f ? c : "#fff"} />
            <path d="M 505 380 L 495 415 M 520 385 L 515 415" stroke="#111" strokeWidth="3" />
            <line x1="555" y1="415" x2="555" y2="425" stroke="#111" strokeWidth="4" />
            <line x1="615" y1="415" x2="615" y2="425" stroke="#111" strokeWidth="4" />
            <circle cx="515" cy="345" r="3" fill="#111" />
          </>
        )}
      </Item>

      {/* sun */}
      <Item id="sun" found={!!found.sun} onTap={onTap} color="#facc15"
        hit={{ x: 530, y: 30, w: 110, h: 110 }}>
        {(f, c) => (
          <>
            <circle cx="585" cy="80" r="28" {...OUTLINE} fill={f ? c : "#fff"} />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * Math.PI) / 4;
              const x1 = 585 + Math.cos(a) * 36;
              const y1 = 80 + Math.sin(a) * 36;
              const x2 = 585 + Math.cos(a) * 48;
              const y2 = 80 + Math.sin(a) * 48;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={f ? c : "#111"} strokeWidth="3" />;
            })}
          </>
        )}
      </Item>
    </svg>
  );
}

// ---------- levels registry ----------
const LEVELS: Level[] = [
  {
    id: 1,
    title: "Bathroom",
    titleAr: "الحمام",
    bg: BathroomScene,
    targets: [
      { id: "bottle", name: "Bottle", nameAr: "زجاجة" },
      { id: "soap", name: "Soap", nameAr: "صابون" },
      { id: "duck", name: "Duck", nameAr: "بطة" },
      { id: "brush", name: "Toothbrush", nameAr: "فرشاة" },
      { id: "towel", name: "Towel", nameAr: "منشفة" },
    ],
    itemColors: { bottle: "#2563eb", soap: "#ec4899", duck: "#facc15", brush: "#22c55e", towel: "#ef4444" },
  },
  {
    id: 2,
    title: "Mosque",
    titleAr: "المسجد",
    bg: MosqueScene,
    targets: [
      { id: "rug", name: "Prayer rug", nameAr: "سجادة" },
      { id: "minbar", name: "Minbar", nameAr: "منبر" },
      { id: "chandelier", name: "Chandelier", nameAr: "ثريا" },
      { id: "quran", name: "Quran", nameAr: "مصحف" },
    ],
    itemColors: { rug: "#dc2626", minbar: "#92400e", chandelier: "#eab308", quran: "#16a34a" },
  },
  {
    id: 3,
    title: "Police Station",
    titleAr: "الشرطة",
    bg: PoliceScene,
    targets: [
      { id: "car", name: "Police car", nameAr: "سيارة شرطة" },
      { id: "badge", name: "Badge", nameAr: "شارة" },
      { id: "walkie", name: "Walkie-talkie", nameAr: "لاسلكي" },
      { id: "cup", name: "Coffee cup", nameAr: "كوب قهوة" },
    ],
    itemColors: { car: "#1d4ed8", badge: "#eab308", walkie: "#111", cup: "#b45309" },
  },
  {
    id: 4,
    title: "Fire Station",
    titleAr: "المطافئ",
    bg: FireScene,
    targets: [
      { id: "truck", name: "Fire truck", nameAr: "شاحنة إطفاء" },
      { id: "helmet", name: "Helmet", nameAr: "خوذة" },
      { id: "ladder", name: "Ladder", nameAr: "سلم" },
      { id: "hydrant", name: "Hydrant", nameAr: "صنبور" },
    ],
    itemColors: { truck: "#dc2626", helmet: "#f59e0b", ladder: "#a16207", hydrant: "#dc2626" },
  },
  {
    id: 5,
    title: "School",
    titleAr: "المدرسة",
    bg: SchoolScene,
    targets: [
      { id: "board", name: "Blackboard", nameAr: "سبورة" },
      { id: "bag", name: "Backpack", nameAr: "حقيبة" },
      { id: "pencil", name: "Pencil", nameAr: "قلم" },
      { id: "globe", name: "Globe", nameAr: "كرة أرضية" },
    ],
    itemColors: { board: "#166534", bag: "#7c3aed", pencil: "#f59e0b", globe: "#3b82f6" },
  },
  {
    id: 6,
    title: "Zoo",
    titleAr: "حديقة الحيوان",
    bg: ZooScene,
    targets: [
      { id: "monkey", name: "Monkey", nameAr: "قرد" },
      { id: "giraffe", name: "Giraffe", nameAr: "زرافة" },
      { id: "elephant", name: "Elephant", nameAr: "فيل" },
      { id: "sun", name: "Sun", nameAr: "شمس" },
    ],
    itemColors: { monkey: "#92400e", giraffe: "#eab308", elephant: "#6b7280", sun: "#facc15" },
  },
];

// ============================================================
// Polaroid target card (mini SVG preview)
// ============================================================
function TargetCard({
  target,
  found,
  color,
}: {
  target: Target;
  found: boolean;
  color: string;
}) {
  return (
    <div
      className={`flex w-28 shrink-0 flex-col items-center rounded-lg border-2 bg-white p-2 shadow-md transition ${
        found ? "border-emerald-500 ring-2 ring-emerald-300" : "border-gray-300"
      }`}
    >
      <div className="flex h-16 w-full items-center justify-center rounded bg-gray-50">
        <div
          className="h-10 w-10 rounded"
          style={{
            background: found ? color : "transparent",
            border: `2px solid ${found ? color : "#111"}`,
          }}
        />
      </div>
      <div className="mt-1 text-center text-xs font-bold text-gray-800" dir="rtl">
        {target.nameAr}
      </div>
      {found && (
        <div className="mt-1 text-lg leading-none text-emerald-600">✓</div>
      )}
    </div>
  );
}

// ============================================================
// Main component
// ============================================================
function HiddenObjectsGame() {
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [found, setFound] = useState<Record<string, boolean>>({});
  const [showFw, setShowFw] = useState(false);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => setCompleted(loadCompleted()), []);

  const level = useMemo(
    () => LEVELS.find((l) => l.id === activeLevel) || null,
    [activeLevel]
  );

  function startLevel(id: number) {
    setActiveLevel(id);
    setFound({});
    setShowWin(false);
    setShowFw(false);
  }

  function backToMenu() {
    setActiveLevel(null);
    setShowWin(false);
    setShowFw(false);
  }

  function handleTap(id: string) {
    if (!level) return;
    if (found[id]) return;
    playPop();
    const next = { ...found, [id]: true };
    setFound(next);
    if (level.targets.every((t) => next[t.id])) {
      setShowFw(true);
      setTimeout(() => {
        setShowFw(false);
        setShowWin(true);
        const c = { ...completed, [level.id]: true };
        setCompleted(c);
        saveCompleted(c);
      }, 1100);
    }
  }

  function nextLevel() {
    if (!level) return;
    const idx = LEVELS.findIndex((l) => l.id === level.id);
    const next = LEVELS[idx + 1];
    if (next) startLevel(next.id);
    else backToMenu();
  }

  // -------- Level Select dashboard --------
  if (!level) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow"
            >
              ← Home
            </Link>
            <h1 className="text-3xl font-extrabold text-amber-900" dir="rtl">
              🔍 إيجاد الأشياء المفقودة
            </h1>
            <div className="w-20" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {LEVELS.map((l) => {
              const done = !!completed[l.id];
              return (
                <button
                  key={l.id}
                  onClick={() => startLevel(l.id)}
                  className={`group flex flex-col items-center gap-2 rounded-2xl border-4 p-6 shadow-lg transition hover:scale-105 ${
                    done
                      ? "border-emerald-600 bg-emerald-500 text-white"
                      : "border-amber-300 bg-white text-amber-900"
                  }`}
                >
                  <div className="text-5xl">
                    {done ? "✅" : `${l.id}`}
                  </div>
                  <div className="text-lg font-extrabold">Level {l.id}</div>
                  <div className="text-sm" dir="rtl">{l.titleAr}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------- Playing a level --------
  const Scene = level.bg;
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-amber-50 to-orange-100">
      {/* top bar */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={backToMenu}
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-900 shadow"
          dir="rtl"
        >
          ← القائمة الرئيسية
        </button>
        <h2 className="text-2xl font-extrabold text-amber-900" dir="rtl">
          {level.titleAr}
        </h2>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-900 shadow">
          {Object.values(found).filter(Boolean).length} / {level.targets.length}
        </div>
      </div>

      {/* scene */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4">
        <div className="aspect-[800/520] w-full overflow-hidden rounded-2xl border-4 border-amber-900/30 bg-white shadow-2xl">
          <Scene found={found} onTap={handleTap} />
        </div>
      </div>

      {/* bottom tray (brown polaroid dock) */}
      <div className="sticky bottom-0 mt-4 px-4 pb-4">
        <div className="mx-auto max-w-5xl rounded-3xl border-4 border-amber-950 bg-gradient-to-b from-amber-700 to-amber-900 p-4 shadow-2xl">
          <div className="mb-2 text-center text-sm font-bold text-amber-100" dir="rtl">
            ابحث عن:
          </div>
          <div className="flex justify-center gap-3 overflow-x-auto">
            {level.targets.map((t) => (
              <TargetCard
                key={t.id}
                target={t}
                found={!!found[t.id]}
                color={level.itemColors[t.id] || "#22c55e"}
              />
            ))}
          </div>
        </div>
      </div>

      {showFw && <Fireworks />}

      {/* win overlay */}
      {showWin && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="text-6xl">🎉</div>
            <div className="mt-4 text-2xl font-extrabold text-emerald-700" dir="rtl">
              ممتاز! لقد وجدت كل الأشياء!
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={nextLevel}
                className="rounded-full bg-emerald-600 px-6 py-3 text-lg font-bold text-white shadow-lg hover:bg-emerald-700"
                dir="rtl"
              >
                المستوى التالي ←
              </button>
              <button
                onClick={backToMenu}
                className="rounded-full bg-gray-200 px-6 py-3 text-sm font-bold text-gray-700"
                dir="rtl"
              >
                القائمة الرئيسية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
