import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getSpeedFactors,
  setSpeedFactors,
  type SpeedLevel,
} from "@/lib/kid";

export const Route = createFileRoute("/parent")({
  component: ParentPage,
});

function RaceSpeedCard() {
  const [factors, setF] = useState<Record<SpeedLevel, number>>({
    green: 1.1, yellow: 1.4, orange: 1.7, red: 2.0,
  });
  useEffect(() => { setF(getSpeedFactors()); }, []);
  function update(level: SpeedLevel, v: string) {
    const num = Number(v);
    if (!Number.isFinite(num) || num < 1) return;
    const next = { ...factors, [level]: num };
    setF(next);
    setSpeedFactors(next);
  }
  const rows: { level: SpeedLevel; label: string; emoji: string }[] = [
    { level: "green", label: "Green", emoji: "🟢" },
    { level: "yellow", label: "Yellow", emoji: "🟡" },
    { level: "orange", label: "Orange", emoji: "🟠" },
    { level: "red", label: "Red", emoji: "🔴" },
  ];
  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl">
      <h2 className="mb-1 text-xl font-extrabold text-rose-700">🏎️ Race Speed</h2>
      <div dir="rtl" className="mb-3 text-sm font-bold text-rose-700">سرعة السباق</div>
      <p className="mb-4 text-sm text-gray-600">
        How much faster the race gets each minute. 1.1 = gentle, 2.0 = very fast.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rows.map((r) => (
          <label key={r.level} className="flex flex-col gap-1 rounded-2xl bg-gray-50 p-3">
            <span className="text-sm font-bold">{r.emoji} {r.label}</span>
            <input
              type="number"
              min={1}
              step={0.1}
              value={factors[r.level]}
              onChange={(e) => update(r.level, e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-lg font-bold"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

const PHASES_EN = [
  { n: 1, t: "Learning the numbers." },
  { n: 2, t: "Learning to count to 10." },
  { n: 3, t: "Learning to count to higher numbers." },
  {
    n: 4,
    t: "Playing the \"BOM Game\": Count sequentially, but whenever you reach a multiple of 5 (5, 10, 15, 20...), say \"BOM\" instead of the number.",
    ex: "Father: 1 → Son: 2 → Father: 3 → Son: 4 → Father: BOM → Son: 6...",
  },
  {
    n: 5,
    t: "Introduction to addition (+). Adding numbers together using an abacus (Rechnerzieher), physical items, or balls.",
  },
  { n: 6, t: "Understanding \"Greater than\" vs. \"Less than\" concepts." },
  {
    n: 7,
    t: "Introduction to subtraction (-). Using an abacus, physical items, or balls to visualize taking away.",
  },
  {
    n: 8,
    t: "The \"Cashier Game\": A dynamic activity used to practice and master addition and subtraction skills.",
  },
];

const PHASES_AR = [
  { n: 1, t: "تعلم الأرقام." },
  { n: 2, t: "العد حتى الرقم 10." },
  { n: 3, t: "العد إلى أرقام أعلى." },
  {
    n: 4,
    t: "لعبة \"بوم\" (BOM): العد بالتسلسل، وعند الوصول إلى مضاعفات الرقم 5 (5، 10، 15، 20...)، يجب قول كلمة \"بوم\" بدلاً من الرقم.",
    ex: "الأب: 1 ← الابن: 2 ← الأب: 3 ← الابن: 4 ← الأب: بوم ← الابن: 6...",
  },
  {
    n: 5,
    t: "مبادئ الجمع (+). إضافة الأرقام باستخدام العداد (Abacus)، أو الأدوات الملموسة، أو الكرات.",
  },
  { n: 6, t: "مقارنة الأرقام (أكبر من وأصغر من)." },
  {
    n: 7,
    t: "مبادئ الطرح (-). استخدام العداد أو الأدوات الملموسة والكرات لتوضيح عملية الطرح.",
  },
  {
    n: 8,
    t: "\"لعبة المحل\": نشاط تفاعلي للتدريب على عمليات الجمع والطرح وإتقانها.",
  },
];

function ParentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-100 px-4 py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow hover:bg-gray-50"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-extrabold text-indigo-900 sm:text-3xl">
            👨‍👩‍👧 Parent Progress
          </h1>
          <div className="w-20" />
        </div>

        <RaceSpeedCard />

        {/* English */}
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-extrabold text-indigo-700">
            Math Skills · English
          </h2>
          </h2>
          <ol className="space-y-3">
            {PHASES_EN.map((p) => (
              <li
                key={p.n}
                className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-50/60 p-3"
              >
                <div className="font-bold text-indigo-900">Phase {p.n}</div>
                <div className="text-gray-700">{p.t}</div>
                {p.ex && (
                  <div className="mt-1 rounded-lg bg-white p-2 text-sm italic text-gray-600">
                    Example: {p.ex}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Arabic */}
        <section dir="rtl" className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-extrabold text-emerald-700">
            المهارات الرياضية (باللغة العربية)
          </h2>
          <ol className="space-y-3">
            {PHASES_AR.map((p) => (
              <li
                key={p.n}
                className="rounded-2xl border-r-4 border-emerald-400 bg-emerald-50/60 p-3"
              >
                <div className="font-bold text-emerald-900">المرحلة {p.n}</div>
                <div className="text-gray-700">{p.t}</div>
                {p.ex && (
                  <div className="mt-1 rounded-lg bg-white p-2 text-sm italic text-gray-600">
                    مثال: {p.ex}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
