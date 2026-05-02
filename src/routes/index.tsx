import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Status = "idle" | "correct" | "wrong";

function randNum() {
  return Math.floor(Math.random() * 11); // 0..10
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
    if (value.trim() === "") return;
    const guess = Number(value);
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
      className={`flex min-h-screen flex-col items-center justify-center px-4 transition-colors duration-300 ${bgClass}`}
    >
      {showFw && <Fireworks />}

      <div className="mb-8 rounded-full bg-card px-6 py-3 shadow-lg">
        <span className="text-lg font-semibold text-muted-foreground">Score: </span>
        <span className="text-2xl font-extrabold text-primary">{score}</span>
      </div>

      <form
        onSubmit={check}
        className="flex flex-col items-center gap-6 rounded-3xl bg-card p-10 shadow-2xl"
      >
        <div className="flex items-center gap-4 text-6xl font-extrabold text-foreground sm:text-7xl">
          <span>{a}</span>
          <span className="text-primary">+</span>
          <span>{b}</span>
          <span className="text-primary">=</span>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (status === "wrong") setStatus("idle");
            }}
            disabled={status === "correct"}
            className="w-28 rounded-2xl border-4 border-primary bg-background px-2 py-2 text-center text-6xl font-extrabold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/30 sm:w-32 sm:text-7xl"
          />
        </div>

        <div className="h-16 text-center">
          {status === "correct" && (
            <div className="animate-bounce text-5xl">🎉✅🎉</div>
          )}
          {status === "wrong" && (
            <div className="text-5xl">
              😢❌ <span className="block text-base text-muted-foreground">Try again!</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-full bg-primary px-8 py-3 text-lg font-bold text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95"
          >
            Check
          </button>
          <button
            type="button"
            onClick={newQuestion}
            className="rounded-full bg-secondary px-8 py-3 text-lg font-bold text-secondary-foreground shadow-lg transition hover:scale-105 active:scale-95"
          >
            Skip
          </button>
        </div>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">Solve the sum and press Check ✨</p>

      <style>{`
        @keyframes firework {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
