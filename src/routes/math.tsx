import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Fireworks } from "@/components/Fireworks";
import { fromAny, getSessionId, toLang, type Lang } from "@/lib/kid";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/math")({
  component: MathPage,
});

type Status = "idle" | "correct" | "wrong";
type Mode = "add" | "compare";

function randNum(max = 10) {
  return Math.floor(Math.random() * (max + 1));
}

function MathPage() {
  const [mode, setMode] = useState<Mode>("add");
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

  function newQuestion(currentMode: Mode = mode) {
    if (currentMode === "add") {
      setA(randNum(10));
      setB(randNum(10));
    } else {
      setA(randNum(100));
      setB(randNum(100));
    }
    setValue("");
    setStatus("idle");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  useEffect(() => {
    newQuestion(mode);
    setScore(0);
    setTotal(0);
    savedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function saveScore() {
    if (savedRef.current || total === 0) return;
    savedRef.current = true;
    await supabase.from("scores").insert({
      session_id: getSessionId(),
      lesson: mode === "add" ? "math_add" : "math_compare",
      correct: score,
      total,
    });
  }

  useEffect(() => {
    const handler = () => {
      void saveScore();
    };
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

  function checkAdd(e: React.FormEvent) {
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

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center px-4 py-6 transition-colors duration-300 ${bgClass}`}
    >
      {showFw && <Fireworks />}

      <Link
        to="/"
        className="absolute left-4 top-4 rounded-full bg-card px-4 py-2 text-sm font-bold shadow"
      >
        ← Home
      </Link>

      <div className="mb-3 flex gap-2 rounded-full bg-card p-1 shadow-md">
        <button
          type="button"
          onClick={() => setMode("add")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            mode === "add" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          ➕ Add
        </button>
        <button
          type="button"
          onClick={() => setMode("compare")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            mode === "compare" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          ⚖️ &gt; &lt; =
        </button>
      </div>

      <div className="mb-3 flex gap-2 rounded-full bg-card p-1 shadow-md">
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

      <div className="mb-6 flex items-center gap-4 rounded-full bg-card px-6 py-3 shadow-lg">
        <span className="text-2xl">⭐</span>
        <span className="text-2xl font-extrabold text-primary">{toLang(score, lang)}</span>
        <span className="text-sm text-muted-foreground">/ {toLang(total, lang)}</span>
      </div>

      {mode === "add" ? (
        <form
          onSubmit={checkAdd}
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
          <div
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="flex items-center justify-center gap-4 text-5xl font-extrabold text-foreground sm:text-6xl"
          >
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
