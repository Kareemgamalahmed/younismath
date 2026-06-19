import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fireworks } from "@/components/Fireworks";
import {
  toLang,
  type Lang,
  getCarColor,
  setCarColor,
  getSpeedLevel,
  setSpeedLevel,
  getSpeedFactors,
  getRaceHiScore,
  setRaceHiScore,
  type SpeedLevel,
} from "@/lib/kid";
import { WORDS, normalizeArabic } from "@/lib/arabic";

export const Route = createFileRoute("/race")({
  component: RacePage,
});

const LANES = 3;
const ROWS = 11;
const PLAYER_ROW = ROWS - 2;
const START_LIVES = 5;
const QUESTION_EVERY = 5;

// Car pixel sprite — 3 wide × 4 tall
const CAR_SPRITE: number[][] = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 1],
];
const CAR_W = 3;
const CAR_H = 4;

type MathQ = { kind: "math"; prompt: string; options: string[]; answer: string };
type ArabicQ = { kind: "arabic"; word: string };
type Question = MathQ | ArabicQ;

function rand(n: number) { return Math.floor(Math.random() * n); }

function makeMath(lang: Lang): MathQ {
  const a = 1 + rand(9), b = 1 + rand(9);
  const op = Math.random() < 0.5 ? "+" : "-";
  const [x, y] = op === "-" && b > a ? [b, a] : [a, b];
  const ans = op === "+" ? x + y : x - y;
  const opts = new Set<number>([ans]);
  while (opts.size < 4) opts.add(Math.max(0, ans + rand(7) - 3));
  const arr = [...opts].sort(() => Math.random() - 0.5);
  return {
    kind: "math",
    prompt: `${toLang(x, lang)} ${op} ${toLang(y, lang)} = ?`,
    options: arr.map((n) => toLang(n, lang)),
    answer: toLang(ans, lang),
  };
}
function makeArabic(): ArabicQ { return { kind: "arabic", word: WORDS[rand(WORDS.length)] }; }

function playCheer() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.type = "triangle";
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
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 180; o.type = "sawtooth";
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {}
}

type Obstacle = { id: number; lane: number; row: number };

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#0ea5e9", "#2563eb", "#6366f1", "#a855f7", "#ec4899",
];

const SPEED_COLORS: Record<SpeedLevel, string> = {
  green: "#22c55e", yellow: "#eab308", orange: "#f97316", red: "#ef4444",
};

function RacePage() {
  const [lang, setLang] = useState<Lang>("en");
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [dodged, setDodged] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [question, setQuestion] = useState<Question | null>(null);
  const [crashFlash, setCrashFlash] = useState(false);
  const [showFw, setShowFw] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [carColor, setCarColorState] = useState("#2563eb");
  const [speedLevel, setSpeedLevelState] = useState<SpeedLevel>("green");
  const [factors, setFactors] = useState<Record<SpeedLevel, number>>({
    green: 1.1, yellow: 1.4, orange: 1.7, red: 2.0,
  });
  const [hiScore, setHi] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [centerTick, setCenterTick] = useState(0);
  const [tickMs, setTickMs] = useState(520);

  const startTimeRef = useRef<number>(Date.now());
  const playerLaneRef = useRef(playerLane);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const pausedRef = useRef(false);
  const overRef = useRef(false);
  const nextIdRef = useRef(1);
  const sinceSpawnRef = useRef(0);
  const speedLevelRef = useRef<SpeedLevel>(speedLevel);
  const factorsRef = useRef(factors);

  useEffect(() => { playerLaneRef.current = playerLane; }, [playerLane]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { pausedRef.current = !!question || gameOver; }, [question, gameOver]);
  useEffect(() => { overRef.current = gameOver; }, [gameOver]);
  useEffect(() => { speedLevelRef.current = speedLevel; }, [speedLevel]);
  useEffect(() => { factorsRef.current = factors; }, [factors]);

  // Init persisted values on mount
  useEffect(() => {
    setCarColorState(getCarColor());
    setSpeedLevelState(getSpeedLevel());
    setFactors(getSpeedFactors());
    setHi(getRaceHiScore());
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  const loseLife = useCallback(() => {
    setLives((l) => {
      const nl = l - 1;
      if (nl <= 0) {
        setGameOver(true);
        overRef.current = true;
        // hi-score update
        setScore((s) => {
          if (s > getRaceHiScore()) { setRaceHiScore(s); setHi(s); }
          return s;
        });
      }
      return Math.max(0, nl);
    });
  }, []);

  const crash = useCallback(() => {
    setCrashFlash(true);
    playBuzz();
    setTimeout(() => setCrashFlash(false), 350);
    setObstacles((obs) => obs.filter((o) => o.row < PLAYER_ROW - 2));
    loseLife();
  }, [loseLife]);

  // Game tick — dynamic tickMs based on elapsed + speed level
  useEffect(() => {
    if (gameOver) return;
    let cancelled = false;
    let timer: any;
    const step = () => {
      if (cancelled) return;
      if (!pausedRef.current && !overRef.current) {
        const moved: Obstacle[] = [];
        let dodgedNow = 0;
        let crashed = false;
        for (const o of obstaclesRef.current) {
          const nr = o.row + 1;
          if (nr === PLAYER_ROW) {
            if (o.lane === playerLaneRef.current) { crashed = true; continue; }
          }
          if (nr > PLAYER_ROW) { dodgedNow += 1; continue; }
          moved.push({ ...o, row: nr });
        }
        sinceSpawnRef.current += 1;
        const spawnEvery = 3;
        if (sinceSpawnRef.current >= spawnEvery) {
          sinceSpawnRef.current = 0;
          const topLanes = new Set(moved.filter((o) => o.row <= 1).map((o) => o.lane));
          const available = [0, 1, 2].filter((l) => !topLanes.has(l));
          if (available.length > 0) {
            moved.push({ id: nextIdRef.current++, lane: available[rand(available.length)], row: 0 });
          }
        }
        setObstacles(moved);
        setCenterTick((t) => t + 1);
        if (dodgedNow > 0) {
          setScore((s) => s + dodgedNow);
          setDodged((d) => {
            const nd = d + dodgedNow;
            if (Math.floor(nd / QUESTION_EVERY) > Math.floor(d / QUESTION_EVERY)) {
              const useArabic = speechSupported && Math.random() < 0.5;
              setQuestion(useArabic ? makeArabic() : makeMath(lang));
            }
            return nd;
          });
        }
        if (crashed) crash();
      }
      // compute next tick
      const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
      const factor = factorsRef.current[speedLevelRef.current];
      const mult = Math.min(Math.pow(factor, elapsedMin), 6);
      const nextMs = Math.max(130, 520 / mult);
      setTickMs(Math.round(nextMs));
      timer = setTimeout(step, nextMs);
    };
    timer = setTimeout(step, tickMs);
    return () => { cancelled = true; clearTimeout(timer); };
    // intentionally only re-init on gameOver / lang change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, lang, crash, speechSupported]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (question || gameOver) return;
      if (e.key === "ArrowLeft") setPlayerLane((l) => Math.max(0, l - 1));
      else if (e.key === "ArrowRight") setPlayerLane((l) => Math.min(LANES - 1, l + 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [question, gameOver]);

  function moveLeft() {
    if (question || gameOver) return;
    setPlayerLane((l) => Math.max(0, l - 1));
  }
  function moveRight() {
    if (question || gameOver) return;
    setPlayerLane((l) => Math.min(LANES - 1, l + 1));
  }

  function answerMath(opt: string) {
    if (!question || question.kind !== "math") return;
    if (opt === question.answer) {
      playCheer(); setShowFw(true); setTimeout(() => setShowFw(false), 1100);
      setQuestion(null);
    } else { playBuzz(); loseLife(); setQuestion(null); }
  }

  function reset() {
    setPlayerLane(1); setObstacles([]); setScore(0); setDodged(0);
    setLives(START_LIVES); setQuestion(null); setGameOver(false);
    overRef.current = false; sinceSpawnRef.current = 0;
    startTimeRef.current = Date.now();
  }

  const closeArabic = (ok: boolean) => {
    if (ok) { playCheer(); setShowFw(true); setTimeout(() => setShowFw(false), 1100); }
    else { playBuzz(); loseLife(); }
    setQuestion(null);
  };

  function pickColor(hex: string) {
    setCarColorState(hex); setCarColor(hex); setShowPalette(false);
  }
  function pickSpeed(l: SpeedLevel) {
    setSpeedLevelState(l); setSpeedLevel(l);
  }

  // Render: compute lit cells of size (LANES*CAR_W) wide × (ROWS*CAR_H) tall
  const COLS_PX = LANES * CAR_W;
  const ROWS_PX = ROWS * CAR_H;

  // Build lit-cell map with color
  const cells = useMemo(() => {
    const map: (string | null)[][] = Array.from({ length: ROWS_PX }, () =>
      Array.from({ length: COLS_PX }, () => null as string | null),
    );
    const drawCar = (row: number, lane: number, color: string) => {
      const baseR = row * CAR_H;
      const baseC = lane * CAR_W;
      for (let r = 0; r < CAR_H; r++) {
        for (let c = 0; c < CAR_W; c++) {
          if (CAR_SPRITE[r][c]) {
            const rr = baseR + r, cc = baseC + c;
            if (rr >= 0 && rr < ROWS_PX && cc >= 0 && cc < COLS_PX) map[rr][cc] = color;
          }
        }
      }
    };
    for (const o of obstacles) drawCar(o.row, o.lane, "#222a1b");
    drawCar(PLAYER_ROW, playerLane, carColor);
    return map;
  }, [obstacles, playerLane, carColor, COLS_PX, ROWS_PX]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-amber-100 to-amber-200 px-4 py-4">
      {showFw && <Fireworks />}

      {/* Top bar */}
      <div className="z-10 flex w-full max-w-md items-center justify-between gap-2">
        <Link to="/" className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold shadow">
          ← Home
        </Link>
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold shadow"
        >
          {lang === "en" ? "🇬🇧 EN" : "🇸🇦 AR"}
        </button>
      </div>

      {/* Lives + score */}
      <div className="z-10 mt-3 flex w-full max-w-md items-center justify-between rounded-full bg-white/90 px-4 py-2 shadow">
        <div className="text-xl tracking-widest">
          {Array.from({ length: START_LIVES }).map((_, i) => (
            <span key={i}>{i < lives ? "❤️" : "🤍"}</span>
          ))}
        </div>
        <div className="text-sm font-extrabold text-gray-800">
          {lang === "en" ? "Score" : "النتيجة"}: {toLang(score, lang)}
        </div>
        <div className="text-xs font-bold" style={{ color: SPEED_COLORS[speedLevel] }}>
          {factors[speedLevel].toFixed(1)}×
        </div>
      </div>

      {/* Speed gauge */}
      <div className="z-10 mt-3 flex w-full max-w-md flex-col items-center rounded-2xl bg-white/90 p-3 shadow">
        <SpeedGauge level={speedLevel} onPick={pickSpeed} />
        <div className="mt-1 text-xs font-bold text-gray-600">
          {lang === "en" ? "Speed" : "السرعة"}: {factors[speedLevel].toFixed(1)}× / min
        </div>
      </div>

      {/* LCD bezel */}
      <div className="mt-3 rounded-[2rem] bg-gradient-to-b from-stone-700 to-stone-900 p-3 shadow-2xl">
        <div className="rounded-2xl bg-stone-800 p-3 shadow-inner">
          <div
            className={`relative rounded-md p-2 transition-colors duration-200 ${
              crashFlash ? "bg-red-300" : "bg-[#9bb39a]"
            }`}
            style={{ boxShadow: "inset 0 4px 12px rgba(0,0,0,0.35)" }}
          >
            <div
              className="grid gap-[1px]"
              style={{
                gridTemplateColumns: `repeat(${COLS_PX}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS_PX}, minmax(0, 1fr))`,
                width: "min(80vw, 270px)",
                aspectRatio: `${COLS_PX} / ${ROWS_PX}`,
              }}
            >
              {cells.flatMap((row, r) =>
                row.map((cellColor, c) => {
                  // Center lane marker scrolling: between lane 0 and lane 1 → col index = CAR_W - 1 ? Actually marker between lanes: col indexes 2 (right edge of lane0) and 5 (right edge of lane1)
                  let marker = false;
                  if (!cellColor && (c === CAR_W - 1 || c === 2 * CAR_W - 1)) {
                    // dashed scrolling: lit when (r + centerTick) % 4 < 2
                    if ((r + centerTick) % 4 < 2) marker = true;
                  }
                  const isWall = c === 0 || c === COLS_PX - 1;
                  const fill = cellColor || (isWall ? "#1a1f1a" : marker ? "#5a6f5a" : "rgba(0,0,0,0.07)");
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="rounded-[1px]"
                      style={{
                        background: fill,
                        border: cellColor
                          ? "1px solid rgba(0,0,0,0.55)"
                          : "1px solid rgba(0,0,0,0.04)",
                      }}
                    />
                  );
                }),
              )}
            </div>
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] tracking-widest text-stone-400">
            <span>HI {hiScore}</span>
            <span>SC {score}</span>
            <span>{tickMs}ms</span>
          </div>
        </div>
      </div>

      {/* Car color picker */}
      <div className="z-10 mt-3 flex w-full max-w-md items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setShowPalette((s) => !s)}
          className="h-10 w-10 rounded-full border-4 border-white shadow-lg"
          style={{ background: carColor }}
          aria-label="Car color"
        />
        <span className="text-xs font-bold text-gray-700">
          {lang === "en" ? "Car color" : "لون السيارة"}
        </span>
      </div>
      {showPalette && (
        <div className="z-10 mt-2 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/95 p-3 shadow-lg">
          {COLOR_PALETTE.map((hex) => (
            <button
              key={hex}
              onClick={() => pickColor(hex)}
              className={`h-8 w-8 rounded-full border-2 shadow ${
                hex === carColor ? "border-black scale-110" : "border-white"
              }`}
              style={{ background: hex }}
              aria-label={hex}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="z-10 mt-3 flex w-full max-w-md items-center justify-center gap-4">
        <button
          onClick={moveLeft}
          disabled={!!question || gameOver}
          className="flex h-20 w-28 items-center justify-center rounded-3xl bg-white text-4xl font-extrabold text-gray-800 shadow-xl active:scale-95 disabled:opacity-50"
        >◀</button>
        <button
          onClick={moveRight}
          disabled={!!question || gameOver}
          className="flex h-20 w-28 items-center justify-center rounded-3xl bg-white text-4xl font-extrabold text-gray-800 shadow-xl active:scale-95 disabled:opacity-50"
        >▶</button>
      </div>

      {/* Math question modal */}
      {question?.kind === "math" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
              {lang === "en" ? "Math" : "حساب"}
            </div>
            <div className="mb-6 text-center text-6xl font-extrabold text-gray-800">
              {question.prompt}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((o) => (
                <button
                  key={o}
                  onClick={() => answerMath(o)}
                  className="rounded-2xl bg-gradient-to-b from-sky-400 to-sky-600 px-4 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95 hover:brightness-110"
                >{o}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {question?.kind === "arabic" && (
        <ArabicQuestionModal word={question.word} onClose={closeArabic} />
      )}

      {gameOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mb-4 text-7xl">💥</div>
            <div className="mb-2 text-3xl font-extrabold text-gray-800">
              {lang === "en" ? "Game Over" : "انتهت اللعبة"}
            </div>
            <div className="mb-2 text-gray-600">
              {lang === "en" ? "Score" : "النتيجة"}: {toLang(score, lang)}
            </div>
            <div className="mb-6 text-sm text-gray-500">
              {lang === "en" ? "Hi-score" : "أعلى نتيجة"}: {toLang(hiScore, lang)}
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

// ---------- Speed gauge (semicircular SVG) ----------
function SpeedGauge({ level, onPick }: { level: SpeedLevel; onPick: (l: SpeedLevel) => void }) {
  // Semicircle from 180° (left) to 0° (right). 4 zones each 45°.
  const W = 220, H = 120, CX = 110, CY = 110, R = 90;
  const zones: { level: SpeedLevel; start: number; end: number; color: string }[] = [
    { level: "green", start: 180, end: 135, color: "#22c55e" },
    { level: "yellow", start: 135, end: 90, color: "#eab308" },
    { level: "orange", start: 90, end: 45, color: "#f97316" },
    { level: "red", start: 45, end: 0, color: "#ef4444" },
  ];
  const polar = (deg: number, r = R) => {
    const rad = (deg * Math.PI) / 180;
    return { x: CX + r * Math.cos(Math.PI - rad), y: CY - r * Math.sin(Math.PI - rad) };
  };
  // Actually simpler: deg measured from +x going CCW. 0° = right, 180° = left.
  const polar2 = (deg: number, r = R) => {
    const rad = (deg * Math.PI) / 180;
    return { x: CX - r * Math.cos(rad), y: CY - r * Math.sin(rad) };
  };
  const arcPath = (a1: number, a2: number) => {
    const p1 = polar2(a1), p2 = polar2(a2);
    const large = 0;
    const sweep = a1 > a2 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} ${sweep} ${p2.x} ${p2.y}`;
  };
  // Needle angle by selected level (zone midpoint)
  const mids: Record<SpeedLevel, number> = { green: 157.5, yellow: 112.5, orange: 67.5, red: 22.5 };
  const needle = polar2(mids[level], R - 10);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {zones.map((z) => (
        <path
          key={z.level}
          d={arcPath(z.start, z.end)}
          stroke={z.color}
          strokeWidth={18}
          fill="none"
          strokeLinecap="butt"
          opacity={level === z.level ? 1 : 0.45}
          onClick={() => onPick(z.level)}
          style={{ cursor: "pointer" }}
        />
      ))}
      {/* Needle */}
      <line x1={CX} y1={CY} x2={needle.x} y2={needle.y} stroke="#111" strokeWidth={3} strokeLinecap="round" />
      <circle cx={CX} cy={CY} r={6} fill="#111" />
      {/* labels */}
      {zones.map((z) => {
        const mid = (z.start + z.end) / 2;
        const p = polar2(mid, R + 12);
        return (
          <text key={z.level} x={p.x} y={p.y} textAnchor="middle" fontSize="10" fontWeight="700" fill={z.color}>
            {z.level[0].toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

// ---------- Arabic mic modal ----------
type ArabicStatus = "idle" | "listening" | "correct" | "wrong";

function ArabicQuestionModal({ word, onClose }: { word: string; onClose: (ok: boolean) => void }) {
  const [status, setStatus] = useState<ArabicStatus>("idle");
  const [heard, setHeard] = useState("");
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const gotResultRef = useRef(false);
  const shouldListenRef = useRef(false);
  const stopTimerRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "ar-SA"; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = true;
    recRef.current = rec;
    return () => { try { rec.stop(); } catch {} };
  }, []);

  function listen() {
    const rec = recRef.current;
    if (!rec || status === "listening" || status === "correct") return;
    setHeard(""); setStatus("listening");
    gotResultRef.current = false; shouldListenRef.current = true;
    const target = normalizeArabic(word);
    const finish = (ok: boolean | null, transcript: string) => {
      if (gotResultRef.current) return;
      gotResultRef.current = true; shouldListenRef.current = false;
      try { rec.stop(); } catch {}
      if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
      if (ok === null) { setStatus("idle"); return; }
      setHeard(transcript);
      if (ok) { setStatus("correct"); setTimeout(() => onClose(true), 800); }
      else { setStatus("wrong"); setTimeout(() => onClose(false), 900); }
    };
    rec.onresult = (ev: any) => {
      let finalAlts: string[] | null = null;
      let interimText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          finalAlts = [];
          for (let j = 0; j < res.length; j++) finalAlts.push(res[j].transcript);
        } else { interimText += res[0].transcript; }
      }
      if (finalAlts) {
        const ok = finalAlts.some((a) => {
          const n = normalizeArabic(a);
          return n === target || n.includes(target) || target.includes(n);
        });
        finish(ok, finalAlts[0] || "");
      } else if (interimText) { setHeard(interimText); }
    };
    rec.onerror = (ev: any) => {
      if (ev?.error === "no-speech") return;
      shouldListenRef.current = false; finish(null, "");
    };
    rec.onend = () => {
      if (shouldListenRef.current && !gotResultRef.current) {
        try { rec.start(); return; } catch {}
      }
      setStatus((s) => (s === "listening" ? "idle" : s));
    };
    try { rec.start(); } catch { setStatus("idle"); }
    stopTimerRef.current = setTimeout(() => {
      if (!gotResultRef.current) {
        shouldListenRef.current = false;
        try { rec.stop(); } catch {}
        onClose(false);
      }
    }, 15000);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div dir="rtl" className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-2xl">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">اقرأ الكلمة</div>
        <div className="text-7xl font-extrabold text-gray-800">{word}</div>
        {!supported && (
          <div className="rounded-xl bg-[oklch(0.9_0.15_25)] px-4 py-2 text-center text-sm">
            المتصفح لا يدعم الصوت. استخدم Chrome.
            <button onClick={() => onClose(true)} className="ml-2 rounded bg-white px-2 py-1 text-xs font-bold">تخطي</button>
          </div>
        )}
        <button
          type="button"
          onClick={listen}
          disabled={!supported || status === "listening" || status === "correct"}
          aria-label="Listen"
          className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl text-white shadow-2xl transition active:scale-95 disabled:opacity-60 ${
            status === "listening" ? "animate-pulse bg-[oklch(0.6_0.22_25)]" : "bg-[oklch(0.65_0.2_260)] hover:scale-110"
          }`}
        >🎤</button>
        <div className="min-h-6 text-center text-sm font-bold text-gray-700">
          {heard && <span>سمعت: {heard}</span>}
        </div>
        <div className="h-8">
          {status === "correct" && <div className="animate-bounce text-3xl">🎉 ✅</div>}
          {status === "wrong" && <div className="text-3xl">😢 ❌</div>}
          {status === "listening" && <div className="text-base">… يستمع</div>}
        </div>
      </div>
    </div>
  );
}
