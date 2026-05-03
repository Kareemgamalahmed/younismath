import { createFileRoute, Link } from "@tanstack/react-router";
import { ScoreHistory } from "@/components/ScoreHistory";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-background to-muted px-4 py-10">
      <Link
        to="/"
        className="self-start rounded-full bg-card px-4 py-2 text-sm font-bold shadow"
      >
        ← Home
      </Link>

      <h1 className="mb-6 mt-4 text-3xl font-extrabold text-foreground">⭐ My History</h1>

      <div className="flex w-full max-w-xl flex-col gap-8">
        <section>
          <h2 className="mb-3 text-xl font-bold">➕ Math — Add</h2>
          <ScoreHistory lesson="math_add" />
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold">⚖️ Math — Compare</h2>
          <ScoreHistory lesson="math_compare" />
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold">أ ب ج Arabic</h2>
          <ScoreHistory lesson="arabic" />
        </section>
      </div>
    </div>
  );
}
