import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getSpeedFactors,
  setSpeedFactors,
  type SpeedLevel,
  getRaceLimitEnabled,
  setRaceLimitEnabled,
  getRacePlayMinutes,
  setRacePlayMinutes,
  getRaceLockHours,
  setRaceLockHours,
  getRacePlayedSeconds,
  raceLockStatus,
  resetRaceLimit,
} from "@/lib/kid";
import { Switch } from "@/components/ui/switch";
import {
  ALL_MODULES,
  getHiddenModules,
  setHiddenModules,
  type ModuleId,
} from "@/lib/modules";

function ModuleVisibilityCard() {
  const [hidden, setHidden] = useState<ModuleId[]>([]);
  useEffect(() => { setHidden(getHiddenModules()); }, []);
  function toggle(id: ModuleId, visible: boolean) {
    const next = visible
      ? hidden.filter((m) => m !== id)
      : Array.from(new Set([...hidden, id]));
    setHidden(next);
    setHiddenModules(next);
  }
  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl">
      <h2 className="mb-1 text-xl font-extrabold text-indigo-700">👁️ Module Visibility</h2>
      <p className="mb-4 text-sm text-gray-600">
        Hide modules you don't want your child to see on the home page.
      </p>
      <ul className="divide-y">
        {ALL_MODULES.map((m) => {
          const visible = !hidden.includes(m.id);
          return (
            <li key={m.id} className="flex items-center justify-between py-3">
              <span className="text-base font-bold">{m.label}</span>
              <Switch checked={visible} onCheckedChange={(v) => toggle(m.id, v)} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

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

function RaceTimeLimitCard() {
  const [enabled, setEnabled] = useState(true);
  const [minutes, setMinutes] = useState("10");
  const [hours, setHours] = useState("24");
  const [statusText, setStatusText] = useState("");

  function refreshStatus() {
    const st = raceLockStatus();
    if (st.unlimited) {
      setStatusText("No limit — the race is always open.");
    } else if (st.locked) {
      setStatusText(`🔒 Locked until ${new Date(st.lockedUntil).toLocaleString()}`);
    } else {
      const usedMin = Math.floor(getRacePlayedSeconds() / 60);
      setStatusText(`${usedMin} / ${getRacePlayMinutes()} min used`);
    }
  }

  useEffect(() => {
    setEnabled(getRaceLimitEnabled());
    setMinutes(String(getRacePlayMinutes()));
    setHours(String(getRaceLockHours()));
    refreshStatus();
    const id = setInterval(refreshStatus, 5000);
    return () => clearInterval(id);
  }, []);

  function toggle(v: boolean) {
    setEnabled(v);
    setRaceLimitEnabled(v);
    refreshStatus();
  }
  function changeMinutes(v: string) {
    setMinutes(v);
    const n = Number(v);
    if (v.trim() !== "" && Number.isFinite(n) && n >= 1) {
      setRacePlayMinutes(n);
      refreshStatus();
    }
  }
  function changeHours(v: string) {
    setHours(v);
    const n = Number(v);
    if (v.trim() !== "" && Number.isFinite(n) && n > 0) {
      setRaceLockHours(n);
      refreshStatus();
    }
  }
  function unlock() {
    resetRaceLimit();
    refreshStatus();
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl">
      <h2 className="mb-1 text-xl font-extrabold text-amber-700">⏱️ Race Time Limit</h2>
      <div dir="rtl" className="mb-3 text-sm font-bold text-amber-700">وقت السباق</div>

      <div className="mb-4 flex items-center justify-between rounded-2xl bg-gray-50 p-3">
        <span className="text-base font-bold">Daily time limit</span>
        <Switch checked={enabled} onCheckedChange={toggle} />
      </div>

      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${enabled ? "" : "pointer-events-none opacity-40"}`}>
        <label className="flex flex-col gap-1 rounded-2xl bg-gray-50 p-3">
          <span className="text-sm font-bold">Minutes of play allowed</span>
          <input
            type="number"
            min={1}
            step={1}
            value={minutes}
            disabled={!enabled}
            onChange={(e) => changeMinutes(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-lg font-bold"
          />
        </label>
        <label className="flex flex-col gap-1 rounded-2xl bg-gray-50 p-3">
          <span className="text-sm font-bold">Then lock for (hours)</span>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={hours}
            disabled={!enabled}
            onChange={(e) => changeHours(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-lg font-bold"
          />
        </label>
      </div>

      <p className="mt-3 text-sm text-gray-600">
        After the minutes run out, the race locks for this many hours, then the time refills.
        Decimals work (0.5 = 30 minutes).
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-3">
        <span className="text-sm font-bold text-amber-900">{statusText}</span>
        <button
          type="button"
          onClick={unlock}
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-amber-600"
        >
          Unlock now / reset
        </button>
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

// ---------- Parent gate ----------
// A multiplication question a young child can't answer. Once passed, the page
// stays open for GATE_MINUTES in this browser tab (sessionStorage), then re-locks.
const GATE_KEY = "parent_unlocked_until";
const GATE_MINUTES = 15;
const MAX_TRIES = 3;
const COOLDOWN_SECONDS = 30;

function gateIsOpen(): boolean {
  try {
    return Number(sessionStorage.getItem(GATE_KEY)) > Date.now();
  } catch {
    return false;
  }
}
function gateOpen() {
  try {
    sessionStorage.setItem(GATE_KEY, String(Date.now() + GATE_MINUTES * 60_000));
  } catch {
    /* ignore */
  }
}
function gateClose() {
  try {
    sessionStorage.removeItem(GATE_KEY);
  } catch {
    /* ignore */
  }
}
function newQuestion() {
  const a = 6 + Math.floor(Math.random() * 4); // 6..9
  const b = 6 + Math.floor(Math.random() * 4);
  return { a, b };
}

function ParentGate({ onPass }: { onPass: () => void }) {
  const [q, setQ] = useState<{ a: number; b: number } | null>(null);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => { setQ(newQuestion()); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q || cooldown > 0) return;
    if (Number(value.trim()) === q.a * q.b) {
      gateOpen();
      onPass();
      return;
    }
    const w = wrong + 1;
    setValue("");
    setQ(newQuestion());
    if (w >= MAX_TRIES) {
      setWrong(0);
      setCooldown(COOLDOWN_SECONDS);
    } else {
      setWrong(w);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-indigo-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl"
      >
        <div className="mb-2 text-6xl">🔒</div>
        <h1 className="text-2xl font-extrabold text-indigo-900">Parents only</h1>
        <div dir="rtl" className="mb-5 text-lg font-bold text-indigo-700">للأهل فقط</div>

        <div className="mb-3 text-4xl font-extrabold text-gray-800" dir="ltr">
          {q ? `${q.a} × ${q.b} = ?` : "…"}
        </div>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={value}
          disabled={cooldown > 0 || !q}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 3))}
          aria-label="Answer"
          className="mb-3 w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-center text-3xl font-extrabold disabled:opacity-50"
        />

        {wrong > 0 && cooldown === 0 && (
          <div className="mb-3 text-sm font-bold text-red-600">Not quite — try again</div>
        )}
        {cooldown > 0 && (
          <div className="mb-3 text-sm font-bold text-red-600">
            Too many tries. Wait {cooldown}s
          </div>
        )}

        <button
          type="submit"
          disabled={cooldown > 0 || !q || value === ""}
          className="mb-3 w-full rounded-full bg-indigo-600 px-6 py-3 text-lg font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          Enter
        </button>
        <Link to="/" className="text-sm font-bold text-gray-500 hover:text-gray-700">
          ← Home
        </Link>
      </form>
    </div>
  );
}

function ParentPage() {
  const [open, setOpen] = useState<boolean | null>(null); // null until read on the client
  useEffect(() => { setOpen(gateIsOpen()); }, []);
  if (open === null) return <div className="min-h-screen bg-slate-50" />;
  if (!open) return <ParentGate onPass={() => setOpen(true)} />;
  return (
    <ParentContent
      onLock={() => {
        gateClose();
        setOpen(false);
      }}
    />
  );
}

function ParentContent({ onLock }: { onLock: () => void }) {
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
          <button
            type="button"
            onClick={onLock}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow hover:bg-gray-50"
          >
            🔒 Lock
          </button>
        </div>

        <ModuleVisibilityCard />
        <RaceSpeedCard />
        <RaceTimeLimitCard />

        {/* English */}
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-extrabold text-indigo-700">
            Math Skills · English
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
