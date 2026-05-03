import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/kid";

type Row = {
  id: string;
  lesson: string;
  correct: number;
  total: number;
  created_at: string;
};

const LABEL: Record<string, string> = {
  math_add: "➕ Add",
  math_compare: "⚖️ Compare",
  arabic: "أ ب ج Arabic",
};

export function ScoreHistory({ lesson, refreshKey }: { lesson?: string; refreshKey?: number }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sessionId = getSessionId();
      let q = supabase
        .from("scores")
        .select("id,lesson,correct,total,created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (lesson) q = q.eq("lesson", lesson);
      const { data } = await q;
      if (!cancelled && data) setRows(data as Row[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [lesson, refreshKey]);

  if (rows.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No history yet — finish a round to save it!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2 text-sm"
        >
          <span className="font-bold">{LABEL[r.lesson] ?? r.lesson}</span>
          <span className="font-mono">
            {r.correct}/{r.total}
          </span>
          <span className="text-muted-foreground">
            {new Date(r.created_at).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
