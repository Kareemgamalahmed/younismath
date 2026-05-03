import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-b from-background to-muted px-4 py-10">
      <h1 className="text-center text-4xl font-extrabold text-foreground sm:text-5xl">
        🎈 Let&apos;s Learn! 🎈
      </h1>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
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
      </div>

      <Link
        to="/history"
        className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
      >
        ⭐ My History
      </Link>
    </div>
  );
}
