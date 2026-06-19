import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Fireworks } from "@/components/Fireworks";
import { toLang, type Lang } from "@/lib/kid";
import { WORDS, normalizeArabic } from "@/lib/arabic";

export const Route = createFileRoute("/race")({
  component: RacePage,
});

// --- Constants ---
const LANES = 3;
const ROWS = 12;
const PLAYER_ROW = ROWS - 1;
const START_LIVES = 5;
const QUESTION_EVERY = 5;

type MathQ = {
  kind: "math";
  prompt: string;
  options: string[];
  answer: string;
};
type ArabicQ = {
  kind: "arabic";
  word: string;
};
type Question = MathQ | ArabicQ;

function rand(n: number) {
  return Math.floor(Math.random() * n);
}

function makeMath(lang: Lang): MathQ {
  const a = 1 + rand(9);
  const b = 1 + rand(9);
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

function makeArabic(): ArabicQ {
  return { kind: "arabic", word: WORDS[rand(WORDS.length)] };
}

// --- Sounds ---
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
    o.start();
    o.stop(ctx.currentTime + 0.3);
  } catch {}
}

// Obstacle: lane (0..2) and row (0..ROWS-1). Lives at index in array.
type Obstacle = { id: number; lane: number; row: number };

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

  const playerLaneRef = useRef(playerLane);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const dodgedRef = useRef(0);
  const pausedRef = useRef(false);
  const overRef = useRef(false);
  const tickRef = useRef<any>(null);
  const nextIdRef = useRef(1);
  const sinceSpawnRef = useRef(0);

  useEffect(() => { playerLaneRef.current = playerLane; }, [playerLane]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { dodgedRef.current = dodged; }, [dodged]);
  useEffect(() => { pausedRef.current = !!question || gameOver; }, [question, gameOver]);
  useEffect(() => { overRef.current = gameOver; }, [gameOver]);

  // Detect speech recognition support
  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    setSpeechSupported(!!SR);
  }, []);

  // Tick interval — speed up as score grows
  const tickMs = Math.max(220, 520 - score * 12);

  const loseLife = useCallback(() => {
    setLives((l) => {
      const nl = l - 1;
      if (nl <= 0) {
        setGameOver(true);
        overRef.current = true;
      }
      return Math.max(0, nl);
    });
  }, []);

  const crash = useCallback(() => {
    setCrashFlash(true);
    playBuzz();
    setTimeout(() => setCrashFlash(false), 350);
    // Clear obstacles in bottom 3 rows
    setObstacles((obs) => obs.filter((o) => o.row < PLAYER_ROW - 2));
    loseLife();
  }, [loseLife]);

  // Game tick
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      if (pausedRef.current || overRef.current) return;
      // Move obstacles down by 1
      const moved: Obstacle[] = [];
      let dodgedNow = 0;
      let crashed = false;
      for (const o of obstaclesRef.current) {
        const nr = o.row + 1;
        if (nr === PLAYER_ROW) {
          if (o.lane === playerLaneRef.current) {
            crashed = true;
            // don't keep this obstacle
            continue;
          }
        }
        if (nr > PLAYER_ROW) {
          // passed off-screen → dodged
          dodgedNow += 1;
          continue;
        }
        moved.push({ ...o, row: nr });
      }
      // Spawn new obstacle every 2 ticks (sometimes 1)
      sinceSpawnRef.current += 1;
      const spawnEvery = score > 10 ? 2 : 3;
      if (sinceSpawnRef.current >= spawnEvery) {
        sinceSpawnRef.current = 0;
        // avoid stacking too many in top row
        const topLanes = new Set(moved.filter((o) => o.row <= 1).map((o) => o.lane));
        const available = [0, 1, 2].filter((l) => !topLanes.has(l));
        if (available.length > 0) {
          const lane = available[rand(available.length)];
          moved.push({ id: nextIdRef.current++, lane, row: 0 });
        }
      }
      setObstacles(moved);
      if (dodgedNow > 0) {
        setScore((s) => s + dodgedNow);
        setDodged((d) => {
          const nd = d + dodgedNow;
          // Trigger a question when crossing a multiple of QUESTION_EVERY
          if (Math.floor(nd / QUESTION_EVERY) > Math.floor(d / QUESTION_EVERY)) {
            // pick math or arabic
            const useArabic = speechSupported && Math.random() < 0.5;
            setQuestion(useArabic ? makeArabic() : makeMath(lang));
          }
          return nd;
        });
      }
      if (crashed) crash();
    }, tickMs);
    tickRef.current = id;
    return () => clearInterval(id);
  }, [tickMs, gameOver, crash, lang, speechSupported]);

  // Keyboard controls
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
      playCheer();
      setShowFw(true);
      setTimeout(() => setShowFw(false), 1100);
      setQuestion(null);
    } else {
      playBuzz();
      loseLife();
      setQuestion(null);
    }
  }

  function reset() {
    setPlayerLane(1);
    setObstacles([]);
    setScore(0);
    setDodged(0);
    setLives(START_LIVES);
    setQuestion(null);
    setGameOver(false);
    overRef.current = false;
    sinceSpawnRef.current = 0;
  }

  const closeArabic = (ok: boolean) => {
    if (ok) {
      playCheer();
      setShowFw(true);
      setTimeout(() => setShowFw(false), 1100);
    } else {
      playBuzz();
      loseLife();
    }
    setQuestion(null);
  };

  // Build grid cells for rendering
  const cellOn = (r: number, c: number) => {
    if (r === PLAYER_ROW && c === playerLane) return true;
    return obstacles.some((o) => o.row === r && o.lane === c);
  };

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
      </div>

      {/* LCD bezel */}
      <div className="mt-4 rounded-[2rem] bg-gradient-to-b from-stone-700 to-stone-900 p-4 shadow-2xl">
        <div className="rounded-2xl bg-stone-800 p-3 shadow-inner">
          {/* LCD screen */}
          <div
            className={`relative rounded-md p-2 transition-colors duration-200 ${
              crashFlash ? "bg-red-300" : "bg-[#9bb39a]"
            }`}
            style={{
              boxShadow: "inset 0 4px 12px rgba(0,0,0,0.35)",
            }}
          >
            <div
              className="grid gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${LANES}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                width: "min(72vw, 240px)",
                aspectRatio: `${LANES} / ${ROWS}`,
              }}
            >
              {Array.from({ length: ROWS }).map((_, r) =>
                Array.from({ length: LANES }).map((__, c) => {
                  const on = cellOn(r, c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="relative rounded-[2px]"
                      style={{
                        background: on ? "#1a1f1a" : "rgba(0,0,0,0.08)",
                        border: on ? "2px solid #9bb39a" : "1px solid rgba(0,0,0,0.06)",
                        boxShadow: on ? "inset 0 0 0 1px #1a1f1a" : "none",
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-2 text-center font-mono text-[10px] tracking-widest text-stone-400">
            BRICK • RACE
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="z-10 mt-4 flex w-full max-w-md items-center justify-center gap-4">
        <button
          onClick={moveLeft}
          disabled={!!question || gameOver}
          className="flex h-20 w-28 items-center justify-center rounded-3xl bg-white text-4xl font-extrabold text-gray-800 shadow-xl active:scale-95 disabled:opacity-50"
        >
          ◀
        </button>
        <button
          onClick={moveRight}
          disabled={!!question || gameOver}
          className="flex h-20 w-28 items-center justify-center rounded-3xl bg-white text-4xl font-extrabold text-gray-800 shadow-xl active:scale-95 disabled:opacity-50"
        >
          ▶
        </button>
      </div>

      {/* Math question */}
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
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Arabic question */}
      {question?.kind === "arabic" && (
        <ArabicQuestionModal
          word={question.word}
          onClose={closeArabic}
        />
      )}

      {/* Game over */}
      {gameOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mb-4 text-7xl">💥</div>
            <div className="mb-2 text-3xl font-extrabold text-gray-800">
              {lang === "en" ? "Game Over" : "انتهت اللعبة"}
            </div>
            <div className="mb-6 text-gray-600">
              {lang === "en" ? "Score" : "النتيجة"}: {toLang(score, lang)}
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

// --- Arabic mic question modal (reuses arabic page logic) ---
type ArabicStatus = "idle" | "listening" | "correct" | "wrong";

function ArabicQuestionModal({
  word,
  onClose,
}: {
  word: string;
  onClose: (ok: boolean) => void;
}) {
  const [status, setStatus] = useState<ArabicStatus>("idle");
  const [heard, setHeard] = useState("");
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const gotResultRef = useRef(false);
  const shouldListenRef = useRef(false);
  const stopTimerRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "ar-SA";
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    rec.continuous = true;
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
  }, []);

  function listen() {
    const rec = recRef.current;
    if (!rec || status === "listening" || status === "correct") return;
    setHeard("");
    setStatus("listening");
    gotResultRef.current = false;
    shouldListenRef.current = true;
    const target = normalizeArabic(word);

    const finish = (ok: boolean | null, transcript: string) => {
      if (gotResultRef.current) return;
      gotResultRef.current = true;
      shouldListenRef.current = false;
      try { rec.stop(); } catch {}
      if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
      if (ok === null) { setStatus("idle"); return; }
      setHeard(transcript);
      if (ok) {
        setStatus("correct");
        setTimeout(() => onClose(true), 800);
      } else {
        setStatus("wrong");
        setTimeout(() => onClose(false), 900);
      }
    };

    rec.onresult = (ev: any) => {
      let finalAlts: string[] | null = null;
      let interimText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          finalAlts = [];
          for (let j = 0; j < res.length; j++) finalAlts.push(res[j].transcript);
        } else {
          interimText += res[0].transcript;
        }
      }
      if (finalAlts) {
        const ok = finalAlts.some((a) => {
          const n = normalizeArabic(a);
          return n === target || n.includes(target) || target.includes(n);
        });
        finish(ok, finalAlts[0] || "");
      } else if (interimText) {
        setHeard(interimText);
      }
    };
    rec.onerror = (ev: any) => {
      if (ev?.error === "no-speech") return;
      shouldListenRef.current = false;
      finish(null, "");
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
        // Treat timeout as wrong so the game resumes
        onClose(false);
      }
    }, 15000);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div
        dir="rtl"
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
          اقرأ الكلمة
        </div>
        <div className="text-7xl font-extrabold text-gray-800">{word}</div>

        {!supported && (
          <div className="rounded-xl bg-[oklch(0.9_0.15_25)] px-4 py-2 text-center text-sm">
            المتصفح لا يدعم الصوت. استخدم Chrome.
            <button
              onClick={() => onClose(true)}
              className="ml-2 rounded bg-white px-2 py-1 text-xs font-bold"
            >
              تخطي
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={listen}
          disabled={!supported || status === "listening" || status === "correct"}
          aria-label="Listen"
          className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl text-white shadow-2xl transition active:scale-95 disabled:opacity-60 ${
            status === "listening"
              ? "animate-pulse bg-[oklch(0.6_0.22_25)]"
              : "bg-[oklch(0.65_0.2_260)] hover:scale-110"
          }`}
        >
          🎤
        </button>

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
