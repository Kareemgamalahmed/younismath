import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toLang } from "@/lib/kid";
import { Fireworks } from "@/components/Fireworks";

export const Route = createFileRoute("/hour")({
  component: HourPage,
});

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const AR_PHRASES: Record<number, string> = {
  0: "الساعه بالضبط",
  5: "و خمسه",
  10: "و عشره",
  15: "و ربع",
  20: "و تلت",
  25: "و نص الا خمسه",
  30: "و نص",
  35: "و نص و خمسه",
  40: "الا تلت",
  45: "الا ربع",
  50: "الا عشره",
  55: "الا خمسه",
};

type Status = "idle" | "listening" | "evaluating" | "correct" | "wrong";

async function evaluateWithGroq(expected: string, said: string): Promise<boolean> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!apiKey) {
    // Fallback: simple substring check
    return said.replace(/\s+/g, "").includes(expected.replace(/\s+/g, ""));
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are an Arabic language evaluator for a kids' learning app. You will be given the correct Arabic phrase for a specific time, and the transcript of what the child actually said. Determine if the child's spoken phrase is correct or close enough to the expected phrase, ignoring minor speech-to-text typos or slight dialect differences. Reply ONLY with the exact word 'RIGHT' if it is acceptable, or 'WRONG' if it is incorrect. Do not include any other text or punctuation.",
        },
        {
          role: "user",
          content: `Correct phrase: '${expected}'. Child said: '${said}'.`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  return /RIGHT/i.test(text);
}

function HourPage() {
  const [idx, setIdx] = useState(0); // index into a 12*12 grid of (h,m)
  const hour = Math.floor(idx / 12) + 1; // 1..12
  const minute = MINUTES[idx % 12];

  const [status, setStatus] = useState<Status>("idle");
  const [heard, setHeard] = useState("");
  const [showFw, setShowFw] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const gotResultRef = useRef(false);
  const shouldListenRef = useRef(false);
  const stopTimerRef = useRef<any>(null);

  // For "الا ..." (to-style) phrases, the spoken hour is the next one
  const isToStyle = minute >= 35;
  const spokenHour = isToStyle ? (hour % 12) + 1 : hour;
  const expectedPhrase = `الساعه ${toLang(spokenHour, "ar")} ${AR_PHRASES[minute]}`;

  const next = () => {
    setIdx((i) => (i + 1) % (12 * 12));
    setStatus("idle");
    setHeard("");
  };
  const prev = () => {
    setIdx((i) => (i - 1 + 12 * 12) % (12 * 12));
    setStatus("idle");
    setHeard("");
  };

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

  async function handleTranscript(transcript: string) {
    setStatus("evaluating");
    try {
      const ok = await evaluateWithGroq(expectedPhrase, transcript);
      if (ok) {
        setStatus("correct");
        setShowFw(true);
        setTimeout(() => setShowFw(false), 1500);
        setTimeout(() => next(), 2000);
      } else {
        setStatus("wrong");
      }
    } catch {
      setStatus("wrong");
    }
  }

  function listen() {
    const rec = recRef.current;
    if (!rec || status === "listening" || status === "evaluating" || status === "correct") return;
    setHeard("");
    setStatus("listening");
    gotResultRef.current = false;
    shouldListenRef.current = true;

    const finish = (transcript: string | null) => {
      if (gotResultRef.current) return;
      gotResultRef.current = true;
      shouldListenRef.current = false;
      try { rec.stop(); } catch {}
      if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
      if (transcript === null) { setStatus("idle"); return; }
      setHeard(transcript);
      void handleTranscript(transcript);
    };

    rec.onresult = (ev: any) => {
      let finalText: string | null = null;
      let interimText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          finalText = (finalText ?? "") + res[0].transcript;
        } else {
          interimText += res[0].transcript;
        }
      }
      if (finalText) finish(finalText);
      else if (interimText) setHeard(interimText);
    };
    rec.onerror = (ev: any) => {
      if (ev?.error === "no-speech") return;
      shouldListenRef.current = false;
      finish(null);
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

    stopTimerRef.current = setTimeout(() => {
      if (!gotResultRef.current) {
        shouldListenRef.current = false;
        try { rec.stop(); } catch {}
        setStatus("idle");
      }
    }, 15000);
  }

  const bgClass =
    status === "correct"
      ? "bg-[oklch(0.92_0.15_145)]"
      : status === "wrong"
        ? "bg-[oklch(0.9_0.15_25)]"
        : "bg-gradient-to-b from-sky-50 to-indigo-100";

  return (
    <div className={`min-h-screen px-4 py-6 transition-colors duration-300 ${bgClass}`}>
      {showFw && <Fireworks />}
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow hover:bg-gray-50"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-extrabold text-indigo-900 sm:text-3xl">
            🕐 Hour · الساعه
          </h1>
          <div className="w-20" />
        </div>

        <Tabs defaultValue="digital" className="w-full">
          <TabsList className="mx-auto grid h-auto w-full max-w-md grid-cols-2 gap-1 p-1">
            <TabsTrigger value="digital" className="py-2 text-base">Digital</TabsTrigger>
            <TabsTrigger value="analog" className="py-2 text-base">Analog</TabsTrigger>
          </TabsList>

          <TabsContent value="digital">
            <DigitalClock hour={hour} minute={minute} />
          </TabsContent>
          <TabsContent value="analog">
            <AnalogClock hour={hour} minute={minute} />
          </TabsContent>
        </Tabs>

        <div dir="rtl" className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="text-4xl font-extrabold text-emerald-700 sm:text-5xl">
            {expectedPhrase}
          </div>
        </div>

        <div dir="rtl" className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-xl">
          <div className="text-sm text-muted-foreground">
            اضغط على الميكروفون واقرأ الوقت
          </div>
          {!supported && (
            <div className="rounded-xl bg-[oklch(0.9_0.15_25)] px-4 py-2 text-center text-sm">
              المتصفح لا يدعم التعرف على الصوت. استخدم Chrome.
            </div>
          )}
          <button
            type="button"
            onClick={listen}
            disabled={!supported || status === "listening" || status === "evaluating" || status === "correct"}
            aria-label="Listen"
            className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl text-white shadow-2xl transition active:scale-95 disabled:opacity-60 ${
              status === "listening"
                ? "animate-pulse bg-[oklch(0.6_0.22_25)]"
                : "bg-[oklch(0.65_0.2_260)] hover:scale-110"
            }`}
          >
            🎤
          </button>
          <div className="min-h-8 text-center text-lg font-bold">
            {heard && <span>سمعت: {heard}</span>}
          </div>
          <div className="flex h-12 items-center justify-center">
            {status === "evaluating" && <div className="text-2xl">🤔 يفكر...</div>}
            {status === "correct" && <div className="animate-bounce text-4xl">🎉 ✅ 🎉</div>}
            {status === "wrong" && <div className="text-4xl">😢 ❌</div>}
            {status === "listening" && <div className="text-2xl">… يستمع</div>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button onClick={prev} size="lg" className="flex-1 text-xl">
            ← Previous
          </Button>
          <Button onClick={next} size="lg" className="flex-1 text-xl">
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}

function DigitalClock({ hour, minute }: { hour: number; minute: number }) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return (
    <div className="mt-2 flex items-center justify-center rounded-3xl bg-black p-10 shadow-xl">
      <div
        className="text-7xl font-extrabold tracking-widest text-emerald-400 sm:text-8xl"
        style={{ fontFamily: "'Courier New', monospace", textShadow: "0 0 18px rgba(16,185,129,0.7)" }}
      >
        {hh}:{mm}
      </div>
    </div>
  );
}

function AnalogClock({ hour, minute }: { hour: number; minute: number }) {
  const size = 280;
  const c = size / 2;
  const minuteAngle = (minute / 60) * 360 - 90;
  const hourAngle = (((hour % 12) + minute / 60) / 12) * 360 - 90;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const mx = c + Math.cos(rad(minuteAngle)) * 105;
  const my = c + Math.sin(rad(minuteAngle)) * 105;
  const hx = c + Math.cos(rad(hourAngle)) * 70;
  const hy = c + Math.sin(rad(hourAngle)) * 70;

  return (
    <div className="mt-2 flex items-center justify-center rounded-3xl bg-white p-6 shadow-xl">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={c - 6} fill="#fff" stroke="#1e293b" strokeWidth="6" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * 360 - 90;
          const x1 = c + Math.cos(rad(a)) * (c - 18);
          const y1 = c + Math.sin(rad(a)) * (c - 18);
          const x2 = c + Math.cos(rad(a)) * (c - 30);
          const y2 = c + Math.sin(rad(a)) * (c - 30);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e293b" strokeWidth="3" />;
        })}
        {Array.from({ length: 12 }).map((_, i) => {
          const num = i + 1;
          const a = (num / 12) * 360 - 90;
          const x = c + Math.cos(rad(a)) * (c - 46);
          const y = c + Math.sin(rad(a)) * (c - 46);
          return (
            <text key={num} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fontSize="22" fontWeight="bold" fill="#1e293b">
              {num}
            </text>
          );
        })}
        {/* hour hand */}
        <line x1={c} y1={c} x2={hx} y2={hy} stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
        {/* minute hand */}
        <line x1={c} y1={c} x2={mx} y2={my} stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
        <circle cx={c} cy={c} r="8" fill="#1e293b" />
      </svg>
    </div>
  );
}
