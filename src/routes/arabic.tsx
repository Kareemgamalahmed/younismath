import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fireworks } from "@/components/Fireworks";
import { getSessionId, toLang } from "@/lib/kid";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/arabic")({
  component: ArabicPage,
});

// 50 three-letter Arabic words with fatha on each letter
const WORDS = [
  "أَكَلَ", "بَحَثَ", "تَرَكَ", "ثَبَتَ", "جَلَسَ", "حَمَلَ", "خَرَجَ", "دَخَلَ", "ذَهَبَ", "رَسَمَ",
  "زَرَعَ", "سَأَلَ", "شَرَحَ", "صَبَرَ", "ضَرَبَ", "طَبَخَ", "ظَهَرَ", "عَرَفَ", "غَسَلَ", "فَتَحَ",
  "قَرَأَ", "كَتَبَ", "لَمَسَ", "مَسَكَ", "نَظَرَ", "هَرَبَ", "وَقَفَ", "نَزَلَ", "حَرَثَ", "رَكَضَ",
  "طَرَقَ", "سَجَدَ", "عَبَدَ", "قَطَعَ", "لَبَسَ", "نَصَرَ", "وَجَدَ", "رَفَعَ", "صَنَعَ", "قَفَزَ",
  "حَكَمَ", "سَبَحَ", "طَحَنَ", "نَشَرَ", "حَصَدَ", "خَلَقَ", "ذَبَحَ", "رَكَبَ", "سَكَنَ", "شَكَرَ",
];

const FATHA = "\u064E";

// Split a word into letter+fatha syllables (handles hamza on alif too)
function splitSyllables(word: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (const ch of word) {
    if (ch === FATHA || /[\u064B-\u0652\u0670]/.test(ch)) {
      buf += ch;
    } else {
      if (buf) out.push(buf);
      buf = ch;
    }
  }
  if (buf) out.push(buf);
  return out;
}

type Status = "idle" | "correct" | "wrong";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ArabicPage() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]); // indices into shuffled
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [showFw, setShowFw] = useState(false);
  const savedRef = useRef(false);

  const word = WORDS[index];
  const syllables = useMemo(() => splitSyllables(word), [word]);
  const shuffled = useMemo(() => shuffle(syllables.map((s, i) => ({ s, i }))), [word]);

  function next() {
    setIndex((i) => (i + 1) % WORDS.length);
    setPicked([]);
    setStatus("idle");
  }

  function pick(shufIdx: number) {
    if (status !== "idle") return;
    const correctNextOriginalIdx = picked.length; // expected next original index
    const chosen = shuffled[shufIdx];
    if (picked.includes(shufIdx)) return;
    if (chosen.i !== correctNextOriginalIdx) {
      setStatus("wrong");
      setTotal((t) => t + 1);
      savedRef.current = false;
      return;
    }
    const newPicked = [...picked, shufIdx];
    setPicked(newPicked);
    if (newPicked.length === syllables.length) {
      setStatus("correct");
      setScore((s) => s + 1);
      setTotal((t) => t + 1);
      savedRef.current = false;
      setShowFw(true);
      setTimeout(() => setShowFw(false), 1100);
      setTimeout(next, 1400);
    }
  }

  function tryAgain() {
    setPicked([]);
    setStatus("idle");
  }

  async function saveScore() {
    if (savedRef.current || total === 0) return;
    savedRef.current = true;
    await supabase.from("scores").insert({
      session_id: getSessionId(),
      lesson: "arabic",
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

      <div className="mb-4 flex items-center gap-4 rounded-full bg-card px-6 py-3 shadow-lg">
        <span className="text-2xl">⭐</span>
        <span className="text-2xl font-extrabold text-primary">{toLang(score, "ar")}</span>
        <span className="text-sm text-muted-foreground">
          {toLang(index + 1, "ar")} / {toLang(WORDS.length, "ar")}
        </span>
      </div>

      <div
        dir="rtl"
        className="flex w-full max-w-lg flex-col items-center gap-8 rounded-3xl bg-card p-8 shadow-2xl"
      >
        {/* Line 1: full word */}
        <div className="text-7xl font-extrabold text-foreground sm:text-8xl">{word}</div>

        {/* Line 2: 3 letter boxes (in correct order, with already-tapped highlighted) */}
        <div className="flex gap-3">
          {syllables.map((syl, i) => {
            const done = i < picked.length;
            return (
              <div
                key={i}
                className={`flex h-20 w-20 items-center justify-center rounded-2xl border-4 text-5xl font-extrabold sm:h-24 sm:w-24 sm:text-6xl ${
                  done
                    ? "border-[oklch(0.7_0.18_145)] bg-[oklch(0.95_0.1_145)] text-foreground"
                    : "border-primary bg-background text-foreground/60"
                }`}
              >
                {done ? syl : "؟"}
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          اضغط الحروف بالترتيب
        </div>

        {/* Shuffled letter buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {shuffled.map((c, idx) => {
            const used = picked.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => pick(idx)}
                disabled={used || status === "correct"}
                className={`flex h-20 w-20 items-center justify-center rounded-2xl text-5xl font-extrabold shadow-lg transition active:scale-95 sm:h-24 sm:w-24 sm:text-6xl ${
                  used
                    ? "bg-muted text-muted-foreground"
                    : "bg-[oklch(0.88_0.15_60)] text-foreground hover:scale-110"
                }`}
              >
                {c.s}
              </button>
            );
          })}
        </div>

        <div className="flex h-12 items-center justify-center">
          {status === "correct" && <div className="animate-bounce text-4xl">🎉 ✅ 🎉</div>}
          {status === "wrong" && <div className="text-4xl">😢 ❌</div>}
        </div>

        <div className="flex gap-4">
          {status === "wrong" && (
            <button
              type="button"
              onClick={tryAgain}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow"
            >
              حاول مرة أخرى
            </button>
          )}
          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.75_0.17_60)] text-3xl text-white shadow-lg transition hover:scale-110"
          >
            ⟳
          </button>
        </div>
      </div>
    </div>
  );
}
