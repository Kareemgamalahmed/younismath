import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getHiddenModules, type ModuleId } from "@/lib/modules";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [hidden, setHidden] = useState<ModuleId[]>([]);
  useEffect(() => {
    setHidden(getHiddenModules());
  }, []);
  const show = (id: ModuleId) => !hidden.includes(id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-b from-background to-muted px-4 py-10">
      <div className="text-7xl sm:text-8xl" aria-label="Learning">
        🎓
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
        {show("math") && (
          <Link
            to="/math"
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.85_0.15_220)] text-6xl shadow-lg group-hover:rotate-6 transition">
              ➕➖
            </div>
            <div className="text-2xl font-extrabold text-foreground">Math</div>
            <div className="text-sm text-muted-foreground">+ and &gt; &lt; =</div>
          </Link>
        )}

        {show("arabic") && (
          <Link
            to="/arabic"
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div
              dir="rtl"
              className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.88_0.15_60)] text-5xl font-extrabold shadow-lg group-hover:-rotate-6 transition"
            >
              أ ب ج
            </div>
            <div className="text-2xl font-extrabold text-foreground">عربي</div>
            <div className="text-sm text-muted-foreground">Arabic letters</div>
          </Link>
        )}

        {show("trace") && (
          <Link
            to="/trace"
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div
              dir="rtl"
              className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.9_0.12_180)] text-5xl font-extrabold text-red-600 shadow-lg group-hover:rotate-6 transition"
              style={{ fontFamily: '"Noto Naskh Arabic","Amiri",serif' }}
            >
              ✍️ أ
            </div>
            <div className="text-2xl font-extrabold text-foreground">كشكول</div>
            <div className="text-sm text-muted-foreground">Trace Arabic letters</div>
          </Link>
        )}

        {show("cashier") && (
          <Link
            to="/cashier"
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.88_0.15_150)] text-6xl shadow-lg group-hover:rotate-6 transition">
              🛒
            </div>
            <div className="text-2xl font-extrabold text-foreground">Cashier</div>
            <div className="text-sm text-muted-foreground">Pay with coins & notes</div>
          </Link>
        )}

        {show("race") && (
          <Link
            to="/race"
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.85_0.15_25)] text-6xl shadow-lg group-hover:rotate-6 transition">
              🏎️
            </div>
            <div className="text-2xl font-extrabold text-foreground">Race</div>
            <div className="text-sm text-muted-foreground">Dodge &amp; answer</div>
          </Link>
        )}

        {show("hidden") && (
          <Link
            to="/hidden"
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.9_0.13_80)] text-6xl shadow-lg group-hover:rotate-6 transition">
              🔍
            </div>
            <div className="text-2xl font-extrabold text-foreground" dir="rtl">إيجاد الأشياء</div>
            <div className="text-sm text-muted-foreground">Hidden objects coloring</div>
          </Link>
        )}

        {show("hour") && (
          <Link
            to="/hour"
            className="group flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl transition hover:scale-105"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[oklch(0.88_0.13_300)] text-6xl shadow-lg group-hover:rotate-6 transition">
              🕐
            </div>
            <div className="text-2xl font-extrabold text-foreground" dir="rtl">الساعه</div>
            <div className="text-sm text-muted-foreground">Tell the time</div>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/history"
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
        >
          ⭐ My History
        </Link>
        <Link
          to="/parent"
          className="rounded-full bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-md hover:bg-gray-50"
        >
          👨‍👩‍👧 Parent Progress
        </Link>
      </div>
    </div>
  );
}
