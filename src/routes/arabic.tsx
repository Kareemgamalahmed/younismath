import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Fireworks } from "@/components/Fireworks";
import { getSessionId, toLang } from "@/lib/kid";
import { supabase } from "@/integrations/supabase/client";

import { WORDS, normalizeArabic as normalize } from "@/lib/arabic";

export const Route = createFileRoute("/arabic")({
  component: ArabicPage,
});

type Status = "idle" | "listening" | "correct" | "wrong";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ArabicPage() {
  const [words] = useState(() => shuffle(WORDS));
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [showFw, setShowFw] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const savedRef = useRef(false);

  const word = words[index];

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
  }, []);

  const gotResultRef = useRef(false);
  const shouldListenRef = useRef(false);
  const stopTimerRef = useRef<any>(null);

  function next() {
    setIndex((i) => (i + 1) % words.length);
    setStatus("idle");
    setHeard("");
  }

  function listen() {
    const rec = recRef.current;
    if (!rec || status === "listening" || status === "correct") return;
    setHeard("");
    setStatus("listening");
    gotResultRef.current = false;
    shouldListenRef.current = true;

    const target = normalize(word);

    const finish = (ok: boolean | null, transcript: string) => {
      if (gotResultRef.current) return;
      gotResultRef.current = true;
      shouldListenRef.current = false;
      try { rec.stop(); } catch {}
      if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
      if (ok === null) { setStatus("idle"); return; }
      setHeard(transcript);
      setTotal((t) => t + 1);
      savedRef.current = false;
      if (ok) {
        setStatus("correct");
        setScore((s) => s + 1);
        setShowFw(true);
        setTimeout(() => setShowFw(false), 1100);
        setTimeout(next, 1500);
      } else {
        setStatus("wrong");
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
          const n = normalize(a);
          return n === target || n.includes(target) || target.includes(n);
        });
        finish(ok, finalAlts[0] || "");
      } else if (interimText) {
        setHeard(interimText);
      }
    };
    rec.onerror = (ev: any) => {
      if (ev?.error === "no-speech") return; // keep waiting
      shouldListenRef.current = false;
      finish(null, "");
    };
    rec.onend = () => {
      if (shouldListenRef.current && !gotResultRef.current) {
        try { rec.start(); return; } catch {}
      }
      setStatus((s) => (s === "listening" ? "idle" : s));
    };
    try {
      rec.start();
    } catch {
      setStatus("idle");
    }

    // Hard stop after 15s so it doesn't listen forever
    stopTimerRef.current = setTimeout(() => {
      if (!gotResultRef.current) {
        shouldListenRef.current = false;
        try { rec.stop(); } catch {}
        setStatus("idle");
      }
    }, 15000);
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
          {toLang(index + 1, "ar")} / {toLang(words.length, "ar")}
        </span>
      </div>

      <div
        dir="rtl"
        className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl bg-card p-8 shadow-2xl"
      >
        <div className="text-7xl font-extrabold text-foreground sm:text-8xl">{word}</div>

        <div className="text-center text-sm text-muted-foreground">
          اضغط على الميكروفون واقرأ الكلمة
        </div>

        {!supported && (
          <div className="rounded-xl bg-[oklch(0.9_0.15_25)] px-4 py-2 text-center text-sm text-foreground">
            المتصفح لا يدعم التعرف على الصوت. استخدم Chrome.
          </div>
        )}

        <button
          type="button"
          onClick={listen}
          disabled={!supported || status === "listening" || status === "correct"}
          aria-label="Listen"
          className={`flex h-28 w-28 items-center justify-center rounded-full text-6xl text-white shadow-2xl transition active:scale-95 disabled:opacity-60 ${
            status === "listening"
              ? "animate-pulse bg-[oklch(0.6_0.22_25)]"
              : "bg-[oklch(0.65_0.2_260)] hover:scale-110"
          }`}
        >
          🎤
        </button>

        <div className="min-h-8 text-center text-lg font-bold text-foreground">
          {heard && <span>سمعت: {heard}</span>}
        </div>

        <div className="flex h-12 items-center justify-center">
          {status === "correct" && <div className="animate-bounce text-4xl">🎉 ✅ 🎉</div>}
          {status === "wrong" && <div className="text-4xl">😢 ❌</div>}
          {status === "listening" && <div className="text-2xl">… يستمع</div>}
        </div>

        <div className="flex gap-4">
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
