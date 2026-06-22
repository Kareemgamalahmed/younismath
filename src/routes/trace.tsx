import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Fireworks } from "@/components/Fireworks";
import { toLang } from "@/lib/kid";

export const Route = createFileRoute("/trace")({
  component: TracePage,
});

// 28 Arabic letters with their spoken names
const LETTERS: { ch: string; name: string }[] = [
  { ch: "أ", name: "ألف" },
  { ch: "ب", name: "باء" },
  { ch: "ت", name: "تاء" },
  { ch: "ث", name: "ثاء" },
  { ch: "ج", name: "جيم" },
  { ch: "ح", name: "حاء" },
  { ch: "خ", name: "خاء" },
  { ch: "د", name: "دال" },
  { ch: "ذ", name: "ذال" },
  { ch: "ر", name: "راء" },
  { ch: "ز", name: "زاي" },
  { ch: "س", name: "سين" },
  { ch: "ش", name: "شين" },
  { ch: "ص", name: "صاد" },
  { ch: "ض", name: "ضاد" },
  { ch: "ط", name: "طاء" },
  { ch: "ظ", name: "ظاء" },
  { ch: "ع", name: "عين" },
  { ch: "غ", name: "غين" },
  { ch: "ف", name: "فاء" },
  { ch: "ق", name: "قاف" },
  { ch: "ك", name: "كاف" },
  { ch: "ل", name: "لام" },
  { ch: "م", name: "ميم" },
  { ch: "ن", name: "نون" },
  { ch: "ه", name: "هاء" },
  { ch: "و", name: "واو" },
  { ch: "ي", name: "ياء" },
];

const LINE_GAP = 110; // px between notebook lines

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch {}
}

function TracePage() {
  const [index, setIndex] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#1f2937");
  const [showFw, setShowFw] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [size, setSize] = useState({ w: 1024, h: 720 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const templateRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const drewSomethingRef = useRef(false);
  const checkTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const letter = LETTERS[index];

  // Resize canvas to container
  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // When letter changes: reset canvas, speak letter name, build template
  useEffect(() => {
    clearCanvas();
    setStrokeColor("#1f2937");
    setWrong(false);
    drewSomethingRef.current = false;
    speak(letter.name);
    buildTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, size.w, size.h]);

  function buildTemplate() {
    const c = templateRef.current;
    if (!c) return;
    c.width = size.w;
    c.height = size.h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#000";
    const fontSize = Math.min(size.h * 0.7, 520);
    ctx.font = `900 ${fontSize}px "Noto Naskh Arabic", "Amiri", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter.ch, size.w / 2, size.h / 2);
  }

  function clearCanvas() {
    const c = canvasRef.current;
    if (!c) return;
    c.width = size.w;
    c.height = size.h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    drewSomethingRef.current = false;
    setWrong(false);
    setStrokeColor("#1f2937");
  }

  function getPoint(e: React.PointerEvent): { x: number; y: number } {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDown(e: React.PointerEvent) {
    if (wrong) setWrong(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPtRef.current = getPoint(e);
  }
  function onMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = getPoint(e);
    const last = lastPtRef.current!;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPtRef.current = p;
    drewSomethingRef.current = true;
  }
  function onUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPtRef.current = null;
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    checkTimerRef.current = setTimeout(check, 350);
  }

  function check() {
    if (!drewSomethingRef.current) return;
    const drawn = canvasRef.current?.getContext("2d");
    const tmpl = templateRef.current?.getContext("2d");
    if (!drawn || !tmpl) return;
    const w = size.w;
    const h = size.h;
    // sample on a smaller grid
    const step = 6;
    const dData = drawn.getImageData(0, 0, w, h).data;
    const tData = tmpl.getImageData(0, 0, w, h).data;
    // dilate template tolerance by checking a neighborhood
    let drawnCount = 0;
    let drawnInsideTemplate = 0;
    let templateCount = 0;
    let templateCovered = 0;

    const tol = 18; // px tolerance around template
    // Precompute template mask presence by walking
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const dAlpha = dData[i + 3];
        const tAlpha = tData[i + 3];
        if (tAlpha > 30) templateCount++;
        if (dAlpha > 30) {
          drawnCount++;
          // check neighborhood in template
          let near = false;
          for (let dy = -tol; dy <= tol && !near; dy += step) {
            for (let dx = -tol; dx <= tol && !near; dx += step) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              const ni = (ny * w + nx) * 4;
              if (tData[ni + 3] > 30) near = true;
            }
          }
          if (near) drawnInsideTemplate++;
        }
        if (tAlpha > 30) {
          // check if any drawn nearby covers this template pixel
          let near = false;
          for (let dy = -tol; dy <= tol && !near; dy += step) {
            for (let dx = -tol; dx <= tol && !near; dx += step) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              const ni = (ny * w + nx) * 4;
              if (dData[ni + 3] > 30) {
                near = true;
              }
            }
          }
          if (near) templateCovered++;
        }
      }
    }
    if (drawnCount < 20 || templateCount < 20) return;
    const precision = drawnInsideTemplate / drawnCount; // % of drawing on letter
    const coverage = templateCovered / templateCount; // % of letter touched

    if (precision >= 0.6 && coverage >= 0.55) {
      // correct! recolor strokes to emerald green
      recolorTo("#10b981");
      setStrokeColor("#10b981");
      setShowFw(true);
      try {
        const u = new SpeechSynthesisUtterance("أحسنت");
        u.lang = "ar-SA";
        window.speechSynthesis?.cancel();
        window.speechSynthesis?.speak(u);
      } catch {}
      setTimeout(() => {
        setShowFw(false);
        setIndex((i) => (i + 1) % LETTERS.length);
      }, 1500);
    } else {
      setWrong(true);
    }
  }

  function recolorTo(color: string) {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    // parse hex
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 0) {
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Build notebook lines as SVG background
  const lines: number[] = [];
  for (let y = LINE_GAP; y < size.h; y += LINE_GAP) lines.push(y);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fdfaf3]" dir="rtl">
      {showFw && <Fireworks />}

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4">
        <Link
          to="/"
          className="pointer-events-auto rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-md hover:bg-slate-50"
        >
          ← الرئيسية
        </Link>

        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2 shadow-md backdrop-blur">
          <button
            type="button"
            onClick={() => speak(letter.name)}
            aria-label="Play letter sound"
            className="text-2xl transition hover:scale-110"
          >
            🔊
          </button>
          <div
            className="text-6xl font-black leading-none text-red-600"
            style={{ fontFamily: '"Noto Naskh Arabic","Amiri",serif' }}
          >
            {letter.ch}
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="pointer-events-none absolute inset-x-0 top-24 z-20 text-center">
        <div className="inline-block rounded-full bg-white/80 px-5 py-1 text-lg font-bold text-slate-700 shadow">
          اكتب الحرف هنا:
        </div>
      </div>

      {/* Notebook page */}
      <div ref={containerRef} className="relative h-screen w-full">
        {/* Notebook lines + right red margin */}
        <svg
          className="absolute inset-0 h-full w-full"
          width={size.w}
          height={size.h}
          aria-hidden
        >
          {lines.map((y) => (
            <line
              key={y}
              x1={0}
              y1={y}
              x2={size.w}
              y2={y}
              stroke="#0d9488"
              strokeWidth={1.5}
              opacity={0.55}
            />
          ))}
          {/* right margin red vertical line */}
          <line
            x1={size.w - 80}
            y1={0}
            x2={size.w - 80}
            y2={size.h}
            stroke="#dc2626"
            strokeWidth={2}
            opacity={0.7}
          />
        </svg>

        {/* Hidden template canvas */}
        <canvas ref={templateRef} className="hidden" />

        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 h-full w-full touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />

        {/* Wrong indicator */}
        {wrong && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-9xl font-black text-red-500/80 drop-shadow-lg">✗</div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between p-4">
        <button
          type="button"
          onClick={clearCanvas}
          aria-label="Clear"
          className="pointer-events-auto rounded-full bg-white px-5 py-3 text-2xl shadow-md transition hover:scale-105"
        >
          🗑️
        </button>

        <div className="pointer-events-auto rounded-full bg-white/90 px-5 py-2 text-base font-bold text-slate-700 shadow-md">
          الحرف {toLang(index + 1, "ar")} من {toLang(LETTERS.length, "ar")}
        </div>

        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % LETTERS.length)}
          className="pointer-events-auto rounded-full bg-slate-800 px-5 py-3 text-base font-bold text-white shadow-md transition hover:scale-105"
        >
          التالي ←
        </button>
      </div>
    </div>
  );
}
