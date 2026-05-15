import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fireworks } from "@/components/Fireworks";
import { toLang, type Lang } from "@/lib/kid";
import truckImg from "@/assets/truck.png";

export const Route = createFileRoute("/race")({
  component: RacePage,
});

type QType = "math" | "arabic";
type Question = {
  type: QType;
  prompt: string;
  options: string[];
  answer: string;
};

const AR_LETTERS = ["أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"];
const AR_NAMES: Record<string, string> = {
  "أ": "alif", "ب": "ba", "ت": "ta", "ث": "tha", "ج": "jeem", "ح": "haa", "خ": "kha",
  "د": "dal", "ذ": "thal", "ر": "ra", "ز": "zay", "س": "seen", "ش": "sheen", "ص": "saad",
  "ض": "daad", "ط": "taa", "ظ": "zaa", "ع": "ayn", "غ": "ghayn", "ف": "fa", "ق": "qaf",
  "ك": "kaf", "ل": "lam", "م": "meem", "ن": "noon", "ه": "ha", "و": "waw", "ي": "ya",
};

function rand(n: number) { return Math.floor(Math.random() * n); }
function pick<T>(a: T[]): T { return a[rand(a.length)]; }

function makeMath(lang: Lang): Question {
  const a = 1 + rand(9);
  const b = 1 + rand(9);
  const op = Math.random() < 0.5 ? "+" : "-";
  const [x, y] = op === "-" && b > a ? [b, a] : [a, b];
  const ans = op === "+" ? x + y : x - y;
  const opts = new Set<number>([ans]);
  while (opts.size < 4) opts.add(Math.max(0, ans + rand(7) - 3));
  const arr = [...opts].sort(() => Math.random() - 0.5);
  return {
    type: "math",
    prompt: `${toLang(x, lang)} ${op} ${toLang(y, lang)} = ?`,
    options: arr.map((n) => toLang(n, lang)),
    answer: toLang(ans, lang),
  };
}

function makeArabic(): Question {
  const letter = pick(AR_LETTERS);
  const correct = AR_NAMES[letter];
  const opts = new Set<string>([correct]);
  while (opts.size < 4) opts.add(AR_NAMES[pick(AR_LETTERS)]);
  return {
    type: "arabic",
    prompt: letter,
    options: [...opts].sort(() => Math.random() - 0.5),
    answer: correct,
  };
}

function makeQuestion(lang: Lang): Question {
  return Math.random() < 0.5 ? makeMath(lang) : makeArabic();
}

// Sound effects via WebAudio
function playCheer() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "triangle";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch {}
}
function playBuzz() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 180;
    o.type = "sawtooth";
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {}
}

// 3 stops along the track at progress percentages
const STOPS = [0.25, 0.55, 0.85];

function RacePage() {
  const [lang, setLang] = useState<Lang>("en");
  const [progress, setProgress] = useState(0); // 0..1
  const [stopIdx, setStopIdx] = useState(0); // next stop index 0..2
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [showFw, setShowFw] = useState(false);
  const [finished, setFinished] = useState(false);
  const [moving, setMoving] = useState(false);
  const moveDir = useRef(0); // -1, 0, +1
  const rafRef = useRef<number | null>(null);

  // Generate stop questions once (regen on reset)
  const [stopQs, setStopQs] = useState<Question[]>(() => STOPS.map(() => makeQuestion(lang)));

  // movement loop
  useEffect(() => {
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (!question && !finished && moveDir.current !== 0) {
        setProgress((p) => {
          let np = p + moveDir.current * dt * 0.12;
          np = Math.max(0, Math.min(1, np));
          // check stop trigger when going forward
          if (moveDir.current > 0 && stopIdx < STOPS.length && np >= STOPS[stopIdx]) {
            np = STOPS[stopIdx];
            setQuestion(stopQs[stopIdx]);
            moveDir.current = 0;
            setMoving(false);
          }
          if (np >= 1 && stopIdx >= STOPS.length) {
            setFinished(true);
            setShowFw(true);
            playCheer();
            setTimeout(() => setShowFw(false), 1500);
          }
          return np;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [question, stopIdx, stopQs, finished]);

  function press(dir: number) {
    if (question || finished) return;
    moveDir.current = dir;
    setMoving(dir !== 0);
  }
  function release() {
    moveDir.current = 0;
    setMoving(false);
  }

  function answer(opt: string) {
    if (!question) return;
    if (opt === question.answer) {
      setFeedback("ok");
      playCheer();
      setShowFw(true);
      setTimeout(() => setShowFw(false), 1200);
      setTimeout(() => {
        setFeedback(null);
        setQuestion(null);
        setStopIdx((i) => i + 1);
      }, 900);
    } else {
      setFeedback("bad");
      playBuzz();
      setTimeout(() => setFeedback(null), 600);
    }
  }

  function reset() {
    setProgress(0);
    setStopIdx(0);
    setQuestion(null);
    setFeedback(null);
    setFinished(false);
    setStopQs(STOPS.map(() => makeQuestion(lang)));
  }

  // Curved isometric path (S-curve) — compute truck position
  const pathPoint = useMemo(() => {
    return (p: number) => {
      // S curve from left-bottom to right-top
      const x = 8 + p * 84; // %
      const y = 78 - Math.sin(p * Math.PI * 1.5) * 30 - p * 10;
      return { x, y };
    };
  }, []);

  const pos = pathPoint(progress);

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200 px-4 py-4 overflow-hidden">
      {showFw && <Fireworks />}

      {/* Top bar */}
      <div className="z-10 flex w-full max-w-5xl items-center justify-between gap-2">
        <Link to="/" className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold shadow">← Home</Link>
        <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow">
          <span className="text-xl">🏁</span>
          <div className="h-3 w-48 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="text-xs font-bold">{toLang(stopIdx, lang)}/{toLang(3, lang)}</span>
        </div>
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold shadow"
        >
          {lang === "en" ? "🇬🇧 EN" : "🇸🇦 AR"}
        </button>
      </div>

      {/* Scene */}
      <div className="relative mt-4 w-full max-w-5xl flex-1" style={{ height: "60vh", minHeight: 380 }}>
        {/* Sky decorations */}
        <div className="absolute left-[10%] top-[5%] text-5xl">☁️</div>
        <div className="absolute right-[15%] top-[10%] text-4xl">☀️</div>
        <div className="absolute left-[60%] top-[3%] text-3xl">☁️</div>

        {/* Isometric ground */}
        <div className="absolute inset-0" style={{ perspective: "800px" }}>
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(180deg, #86efac 0%, #4ade80 60%, #22c55e 100%)",
              transform: "rotateX(45deg) translateY(20%)",
              transformOrigin: "center bottom",
              boxShadow: "inset 0 -40px 60px rgba(0,0,0,0.15)",
            }}
          />
        </div>

        {/* SVG track curve */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="road" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
          </defs>
          <path
            d={buildPath(pathPoint)}
            stroke="url(#road)"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={buildPath(pathPoint)}
            stroke="white"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Stops (sprites) */}
        {STOPS.map((s, i) => {
          const sp = pathPoint(s);
          const done = i < stopIdx;
          const active = i === stopIdx;
          const icons = ["🎯", "⛳", "🏁"];
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-full text-center"
              style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
            >
              <div className={`text-5xl drop-shadow-lg transition ${done ? "opacity-30 grayscale" : active ? "animate-bounce" : ""}`}>
                {icons[i]}
              </div>
              <div className="mx-auto -mt-1 h-1 w-8 rounded-full bg-black/30" />
            </div>
          );
        })}

        {/* Truck sprite */}
        <img
          src={truckImg}
          alt="truck"
          className="absolute h-auto w-32 -translate-x-1/2 -translate-y-1/2 select-none transition-transform sm:w-40"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) scaleX(${moveDir.current < 0 ? -1 : 1}) ${moving ? "translateY(-2px)" : ""}`,
            filter: "drop-shadow(0 8px 6px rgba(0,0,0,0.3))",
          }}
          draggable={false}
        />

        {/* Finish flag */}
        <div className="absolute" style={{ left: `${pathPoint(1).x}%`, top: `${pathPoint(1).y}%`, transform: "translate(-50%, -100%)" }}>
          <div className="text-5xl">🏆</div>
        </div>
      </div>

      {/* Controls */}
      <div className="z-10 mt-3 flex w-full max-w-5xl items-center justify-center gap-4">
        <button
          onPointerDown={() => press(-1)}
          onPointerUp={release}
          onPointerLeave={release}
          disabled={!!question || finished}
          className="flex h-20 w-24 items-center justify-center rounded-3xl bg-white text-4xl font-extrabold text-gray-800 shadow-xl active:scale-95 disabled:opacity-50"
        >
          ◀
        </button>
        <button
          onPointerDown={() => press(1)}
          onPointerUp={release}
          onPointerLeave={release}
          disabled={!!question || finished}
          className="flex h-20 w-40 items-center justify-center rounded-3xl bg-orange-500 text-3xl font-extrabold text-white shadow-xl active:scale-95 disabled:opacity-50"
        >
          🚗 GO
        </button>
        <button
          onPointerDown={() => press(1)}
          onPointerUp={release}
          onPointerLeave={release}
          disabled={!!question || finished}
          className="flex h-20 w-24 items-center justify-center rounded-3xl bg-white text-4xl font-extrabold text-gray-800 shadow-xl active:scale-95 disabled:opacity-50"
        >
          ▶
        </button>
      </div>

      {/* Question modal */}
      {question && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className={`w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition ${feedback === "bad" ? "ring-8 ring-red-400" : feedback === "ok" ? "ring-8 ring-green-400" : ""}`}>
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
              {question.type === "math" ? (lang === "en" ? "Math" : "حساب") : (lang === "en" ? "Arabic letter" : "حرف عربي")}
            </div>
            <div
              dir={question.type === "arabic" ? "rtl" : "ltr"}
              className="mb-6 text-center text-6xl font-extrabold text-gray-800"
            >
              {question.prompt}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((o) => (
                <button
                  key={o}
                  onClick={() => answer(o)}
                  className="rounded-2xl bg-gradient-to-b from-sky-400 to-sky-600 px-4 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95 hover:brightness-110"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Finish modal */}
      {finished && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mb-4 text-7xl">🏆</div>
            <div className="mb-2 text-3xl font-extrabold text-gray-800">
              {lang === "en" ? "You Won!" : "لقد فزت!"}
            </div>
            <div className="mb-6 text-gray-600">
              {lang === "en" ? "Great driving!" : "قيادة رائعة!"}
            </div>
            <button
              onClick={reset}
              className="rounded-full bg-orange-500 px-8 py-3 text-lg font-bold text-white shadow-lg hover:bg-orange-600"
            >
              {lang === "en" ? "Play again" : "العب مرة أخرى"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildPath(fn: (p: number) => { x: number; y: number }) {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const { x, y } = fn(i / 40);
    pts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }
  return pts.join(" ");
}
