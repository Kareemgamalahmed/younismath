import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toLang } from "@/lib/kid";

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

function HourPage() {
  const [idx, setIdx] = useState(0); // index into a 12*12 grid of (h,m)
  const hour = Math.floor(idx / 12) + 1; // 1..12
  const minute = MINUTES[idx % 12];

  const next = () => setIdx((i) => (i + 1) % (12 * 12));
  const prev = () => setIdx((i) => (i - 1 + 12 * 12) % (12 * 12));

  // For "الا ..." (to-style) phrases, the spoken hour is the next one
  const isToStyle = minute >= 35;
  const spokenHour = isToStyle ? (hour % 12) + 1 : hour;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-100 px-4 py-6">
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

        <div
          dir="rtl"
          className="rounded-3xl bg-white p-6 text-center shadow-xl"
        >
          <div className="text-4xl font-extrabold text-emerald-700 sm:text-5xl">
            الساعه {toLang(spokenHour, "ar")} {AR_PHRASES[minute]}
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
