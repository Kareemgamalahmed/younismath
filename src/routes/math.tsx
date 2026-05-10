import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Fireworks } from "@/components/Fireworks";
import { fromAny, getSessionId, toLang, type Lang } from "@/lib/kid";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/math")({
  component: MathPage,
});

type Status = "idle" | "correct" | "wrong";
type Mode = "menu" | "add" | "sub" | "compare";

function rand(max: number) {
  return Math.floor(Math.random() * (max + 1));
}

function MathPage() {
  const [mode, setMode] = useState<Mode>("menu");
  const [lang, setLang] = useState<Lang>("en");
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [showFw, setShowFw] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  function newQuestion(m: Mode = mode) {
    if (m === "add") {
      setA(rand(10));
      setB(rand(10));
    } else if (m === "compare") {
      setA(rand(100));
      setB(rand(100));
    }
    setValue("");
    setStatus("idle");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (mode !== "menu") newQuestion(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function saveScore() {
    if (savedRef.current || total === 0) return;
    savedRef.current = true;
    await supabase.from("scores").insert({
      session_id: getSessionId(),
      lesson: "math",
      correct: score,
      total,
    });
  }

  useEffect(() => {
    const handler = () => void saveScore();
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      void saveScore();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, total]);

  function handleResult(ok: boolean) {
    setTotal((t) => t + 1);
    savedRef.current = false;
    if (ok) {
      setStatus("correct");
      setScore((s) => s + 1);
      setShowFw(true);
      setTimeout(() => setShowFw(false), 1100);
      setTimeout(() => newQuestion(), 1200);
    } else {
      setStatus("wrong");
    }
  }

  function checkInput(e: React.FormEvent) {
    e.preventDefault();
    const ascii = fromAny(value);
    if (ascii === "") return;
    handleResult(Number(ascii) === a + b);
  }

  function checkCompare(sym: ">" | "<" | "=") {
    if (status === "correct") return;
    const correctSym = a > b ? ">" : a < b ? "<" : "=";
    handleResult(sym === correctSym);
  }

  const bgClass =
    status === "correct"
      ? "bg-[oklch(0.92_0.15_145)]"
      : status === "wrong"
        ? "bg-[oklch(0.9_0.15_25)]"
        : "bg-background";

  if (mode === "menu") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-b from-background to-muted px-4 py-10">
        <Link
          to="/"
          className="absolute left-4 top-4 rounded-full bg-card px-4 py-2 text-sm font-bold shadow"
        >
          ← Home
        </Link>
        <div className="text-6xl">🔢</div>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("add")}
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.85_0.18_145)] text-6xl shadow-lg group-hover:rotate-6 transition">
              ➕
            </div>
            <div className="text-2xl font-extrabold text-foreground">Add</div>
            <div className="text-sm text-muted-foreground">2 + 3 = ?</div>
          </button>

          <button
            type="button"
            onClick={() => setMode("compare")}
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.85_0.15_220)] text-5xl font-extrabold shadow-lg group-hover:-rotate-6 transition">
              {"< = >"}
            </div>
            <div className="text-2xl font-extrabold text-foreground">Compare</div>
            <div className="text-sm text-muted-foreground">5 ? 8</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center px-4 py-6 transition-colors duration-300 ${bgClass}`}
    >
      {showFw && <Fireworks />}

      <button
        type="button"
        onClick={() => {
          void saveScore();
          setMode("menu");
          setScore(0);
          setTotal(0);
        }}
        className="absolute left-4 top-4 rounded-full bg-card px-4 py-2 text-sm font-bold shadow"
      >
        ← Menu
      </button>

      <div className="mb-3 mt-2 flex gap-2 rounded-full bg-card p-1 shadow-md">
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
            lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          123
        </button>
        <button
          type="button"
          onClick={() => setLang("ar")}
          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
            lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          ١٢٣
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4 rounded-full bg-card px-6 py-3 shadow-lg">
        <span className="text-2xl">⭐</span>
        <span className="text-2xl font-extrabold text-primary">{toLang(score, lang)}</span>
        <span className="text-sm text-muted-foreground">/ {toLang(total, lang)}</span>
      </div>

      {mode === "add" ? (
        <form
          onSubmit={checkInput}
          className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-card p-8 shadow-2xl"
        >
          <div
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="flex flex-wrap items-center justify-center gap-3 text-5xl font-extrabold text-foreground sm:text-7xl"
          >
            <span>{toLang(a, lang)}</span>
            <span className="text-primary">+</span>
            <span>{toLang(b, lang)}</span>
            <span className="text-primary">=</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (status === "wrong") setStatus("idle");
              }}
              disabled={status === "correct"}
              className="w-24 rounded-2xl border-4 border-primary bg-background px-2 py-2 text-center text-5xl font-extrabold text-foreground outline-none focus:ring-4 focus:ring-primary/30 sm:w-28 sm:text-7xl"
            />
          </div>

          <Feedback status={status} />

          <div className="flex gap-4">
            <button
              type="submit"
              aria-label="Check"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.7_0.18_145)] text-4xl text-white shadow-lg transition hover:scale-110 active:scale-95"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => newQuestion()}
              aria-label="Next"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.75_0.17_60)] text-4xl text-white shadow-lg transition hover:scale-110 active:scale-95"
            >
              ⟳
            </button>
          </div>
        </form>
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-card p-8 shadow-2xl">
          {/* Always LTR so the left number is mathematically the left operand */}
          <div className="flex items-center justify-center gap-4 text-5xl font-extrabold text-foreground sm:text-6xl">
            <span>{toLang(a, lang)}</span>
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 ${
                status === "idle"
                  ? "border-primary text-primary/40"
                  : status === "correct"
                    ? "border-[oklch(0.7_0.18_145)] text-[oklch(0.5_0.2_145)]"
                    : "border-[oklch(0.6_0.22_25)] text-[oklch(0.5_0.22_25)]"
              }`}
            >
              {status === "correct" ? (a > b ? ">" : a < b ? "<" : "=") : "?"}
            </span>
            <span>{toLang(b, lang)}</span>
          </div>

          <Feedback status={status} />

          <div className="flex gap-4">
            {(["<", "=", ">"] as const).map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => checkCompare(sym)}
                disabled={status === "correct"}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[oklch(0.85_0.15_220)] text-5xl font-extrabold text-foreground shadow-lg transition hover:scale-110 active:scale-95 disabled:opacity-50"
              >
                {sym}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => newQuestion()}
            aria-label="Next"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.75_0.17_60)] text-2xl text-white shadow-lg transition hover:scale-110"
          >
            ⟳
          </button>
        </div>
      )}

      {mode === "add" && <Abacus resetKey={`${a}-${b}-${total}`} />}
    </div>
  );
}

function Feedback({ status }: { status: Status }) {
  return (
    <div className="flex h-16 items-center justify-center text-center">
      {status === "correct" && <div className="animate-bounce text-5xl">🎉 ✅ 🎉</div>}
      {status === "wrong" && <div className="text-5xl">😢 ❌</div>}
    </div>
  );
}

const COL_COLORS = ["oklch(0.75 0.18 25)", "oklch(0.75 0.18 230)"];
const MAX_STACK = 15;

function Abacus({ resetKey }: { resetKey: string }) {
  return (
    <div className="mt-4 w-full max-w-md rounded-3xl bg-card p-3 shadow-xl">
      <div className="mb-2 text-center text-xs font-bold text-muted-foreground">
        Tap a column to stack circles 👇
      </div>
      <div className="flex justify-center gap-8">
        {COL_COLORS.map((c, i) => (
          <StackColumn key={`${resetKey}-${i}`} color={c} />
        ))}
      </div>
    </div>
  );
}

function StackColumn({ color }: { color: string }) {
  const [count, setCount] = useState(0);
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setCount((c) => Math.min(MAX_STACK, c + 1))}
        className="relative flex h-96 w-20 flex-col-reverse items-center justify-start gap-1.5 rounded-full border-4 border-[oklch(0.7_0.05_60)] bg-[oklch(0.97_0.01_85)] p-2 transition active:scale-[0.98]"
      >
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className="h-12 w-12 rounded-full border border-[oklch(0.3_0.05_60)] shadow-sm"
            style={{ background: color }}
          />
        ))}
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCount((c) => Math.max(0, c - 1))}
          className="rounded-full bg-card px-3 py-1 text-xs font-bold shadow"
        >
          −
        </button>
        <span className="min-w-6 text-center text-sm font-extrabold text-foreground">{count}</span>
        <button
          type="button"
          onClick={() => setCount(0)}
          className="rounded-full bg-card px-3 py-1 text-xs font-bold shadow"
        >
          ⟳
        </button>
      </div>
    </div>
  );
}
