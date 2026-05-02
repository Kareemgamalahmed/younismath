import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Status = "idle" | "correct" | "wrong";
type Lang = "en" | "ar";

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

function toLang(n: number | string, lang: Lang) {
  const s = String(n);
  if (lang === "en") return s;
  return s
    .split("")
    .map((c) => (/\d/.test(c) ? AR_DIGITS[Number(c)] : c))
    .join("");
}

function fromAny(s: string) {
  return s
    .split("")
    .map((c) => {
      const i = AR_DIGITS.indexOf(c);
      return i >= 0 ? String(i) : c;
    })
    .join("")
    .replace(/[^\d-]/g, "");
}

function randNum() {
  return Math.floor(Math.random() * 11);
}

function Fireworks() {
  const particles = Array.from({ length: 40 });
  const colors = ["#ff3b30", "#ffcc00", "#34c759", "#5ac8fa", "#af52de", "#ff9500"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = 200 + Math.random() * 200;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}`,
              animation: `firework 1.1s ease-out forwards`,
              ["--x" as any]: `${x}px`,
              ["--y" as any]: `${y}px`,
            }}
          />
        );
      })}
    </div>
  );
}

function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [showFw, setShowFw] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function newQuestion() {
    setA(randNum());
    setB(randNum());
    setValue("");
    setStatus("idle");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  useEffect(() => {
    newQuestion();
  }, []);

  function check(e: React.FormEvent) {
    e.preventDefault();
    const ascii = fromAny(value);
    if (ascii === "") return;
    const guess = Number(ascii);
    if (guess === a + b) {
      setStatus("correct");
      setScore((s) => s + 1);
      setShowFw(true);
      setTimeout(() => setShowFw(false), 1100);
      setTimeout(newQuestion, 1200);
    } else {
      setStatus("wrong");
    }
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

      <div className="mb-4 flex gap-2 rounded-full bg-card p-1 shadow-md">
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            lang === "en" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
          }`}
        >
          123 English
        </button>
        <button
          type="button"
          onClick={() => setLang("ar")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            lang === "ar" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
          }`}
        >
          ١٢٣ عربي
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-full bg-card px-6 py-3 shadow-lg">
        <span className="text-2xl">⭐</span>
        <span className="text-2xl font-extrabold text-primary">{toLang(score, lang)}</span>
      </div>

      <form
        onSubmit={check}
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

        <div className="flex h-16 items-center justify-center text-center">
          {status === "correct" && <div className="animate-bounce text-5xl">🎉 ✅ 🎉</div>}
          {status === "wrong" && <div className="text-5xl">😢 ❌</div>}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            aria-label="Check answer"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.7_0.18_145)] text-4xl text-white shadow-lg transition hover:scale-110 active:scale-95"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={newQuestion}
            aria-label="Next question"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.75_0.17_60)] text-4xl text-white shadow-lg transition hover:scale-110 active:scale-95"
          >
            ⟳
          </button>
        </div>
      </form>

      <style>{`
        @keyframes firework {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
