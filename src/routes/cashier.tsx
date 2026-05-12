import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Wallet, HandCoins, Calculator, X, ShoppingCart, Receipt, Coins } from "lucide-react";
import { Fireworks } from "@/components/Fireworks";
import { fromAny, toLang, type Lang } from "@/lib/kid";

export const Route = createFileRoute("/cashier")({
  component: CashierPage,
});

type Product = { name: string; emoji: string };

const PRODUCTS: Product[] = [
  { name: "Milk", emoji: "🥛" },
  { name: "Eggs", emoji: "🥚" },
  { name: "Bread", emoji: "🍞" },
  { name: "Ice cream", emoji: "🍦" },
  { name: "Cheese", emoji: "🧀" },
  { name: "Apple", emoji: "🍎" },
  { name: "Banana", emoji: "🍌" },
  { name: "Chocolate", emoji: "🍫" },
  { name: "Juice", emoji: "🧃" },
  { name: "Cookies", emoji: "🍪" },
  { name: "Pizza", emoji: "🍕" },
  { name: "Water", emoji: "💧" },
];

const MONEY = [1, 2, 5, 10, 20, 50, 100, 200];

// Color-coded per spec
function moneyStyle(c: number) {
  switch (c) {
    case 1:
    case 2:
      return { cls: "bg-yellow-300 text-yellow-900 border-yellow-500", shape: "rounded-full" };
    case 5:
      return { cls: "bg-emerald-200 text-emerald-900 border-emerald-500", shape: "rounded-md" };
    case 10:
      return { cls: "bg-red-400 text-white border-red-600", shape: "rounded-md" };
    case 20:
      return { cls: "bg-blue-400 text-white border-blue-600", shape: "rounded-md" };
    case 50:
      return { cls: "bg-orange-400 text-white border-orange-600", shape: "rounded-md" };
    case 100:
      return { cls: "bg-green-500 text-white border-green-700", shape: "rounded-md" };
    case 200:
      return { cls: "bg-yellow-400 text-yellow-900 border-yellow-600", shape: "rounded-md" };
    default:
      return { cls: "bg-gray-200 text-gray-800 border-gray-400", shape: "rounded-md" };
  }
}

function newCart(minItems: number, maxItems: number, maxTotal: number) {
  const min = Math.max(1, Math.min(minItems, maxItems));
  const upper = Math.max(min, maxItems);
  const n = min + Math.floor(Math.random() * (upper - min + 1));
  const pool = [...PRODUCTS].sort(() => Math.random() - 0.5);
  // Try a few times to satisfy the max total constraint with random prices
  for (let attempt = 0; attempt < 50; attempt++) {
    const cart: { product: Product; price: number }[] = [];
    for (let i = 0; i < n; i++) {
      const p = pool[i % pool.length];
      const price = 1 + Math.floor(Math.random() * 10);
      cart.push({ product: p, price });
    }
    const sum = cart.reduce((s, c) => s + c.price, 0);
    if (sum <= maxTotal) return cart;
  }
  // Fallback: cap each price so the sum fits
  const cap = Math.max(1, Math.floor(maxTotal / n));
  const cart: { product: Product; price: number }[] = [];
  let remaining = maxTotal;
  for (let i = 0; i < n; i++) {
    const p = pool[i % pool.length];
    const left = n - i;
    const maxAllowed = Math.max(1, Math.min(cap, remaining - (left - 1)));
    const price = 1 + Math.floor(Math.random() * maxAllowed);
    remaining -= price;
    cart.push({ product: p, price });
  }
  return cart;
}

// Tada sound via WebAudio (no asset needed)
function playTada() {
  try {
    const AC =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      o.start(t0);
      o.stop(t0 + 0.5);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* ignore */
  }
}

function AbacusWidget({ onClose }: { onClose: () => void }) {
  const rows = 10;
  const cols = 10;
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-400",
    "bg-yellow-400",
    "bg-lime-500",
    "bg-green-500",
    "bg-teal-500",
    "bg-sky-500",
    "bg-indigo-500",
    "bg-purple-500",
  ];
  const [active, setActive] = useState<boolean[][]>(() =>
    Array.from({ length: rows }, () => Array(cols).fill(false)),
  );
  function toggle(r: number, c: number) {
    setActive((prev) => {
      const next = prev.map((row) => [...row]);
      // Push beads to the left up to and including clicked column
      const willActivate = !next[r][c];
      for (let i = 0; i < cols; i++) {
        next[r][i] = willActivate ? i <= c : i < c;
      }
      return next;
    });
  }
  const total = active.flat().filter(Boolean).length;
  return (
    <div className="fixed right-4 top-20 z-40 w-[340px] rounded-2xl border-4 border-amber-700 bg-amber-50 p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-extrabold text-amber-900">🧮 Abacus · {total}</div>
        <button
          onClick={onClose}
          className="rounded-full bg-white p-1 text-gray-600 shadow hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1 rounded-xl bg-amber-900/90 p-2">
        {active.map((row, r) => (
          <div key={r} className="flex items-center gap-1">
            {row.map((on, c) => (
              <button
                key={c}
                onClick={() => toggle(r, c)}
                className={`h-6 w-6 rounded-full border border-amber-200 transition ${
                  on ? colors[r] : "bg-amber-700/40"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <button
        onClick={() =>
          setActive(Array.from({ length: rows }, () => Array(cols).fill(false)))
        }
        className="mt-2 w-full rounded-lg bg-amber-700 py-1 text-xs font-bold text-white hover:bg-amber-800"
      >
        Reset
      </button>
    </div>
  );
}

function CashierPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [minItems, setMinItems] = useState(2);
  const [maxItems, setMaxItems] = useState(5);
  const [maxTotal, setMaxTotal] = useState(50);
  const [cart, setCart] = useState<{ product: Product; price: number }[]>([]);
  const [paid, setPaid] = useState<number[]>([]);
  const [totalInput, setTotalInput] = useState("");
  const [changeInput, setChangeInput] = useState("");
  const [cmpAnswer, setCmpAnswer] = useState<"<" | ">" | "=" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showFw, setShowFw] = useState(false);
  const [showAbacus, setShowAbacus] = useState(false);
  const tadaPlayed = useRef(false);

  useEffect(() => {
    setCart(newCart(minItems, maxItems, maxTotal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => cart.reduce((s, c) => s + c.price, 0), [cart]);
  const paidTotal = paid.reduce((s, c) => s + c, 0);
  const expectedChange = Math.max(0, paidTotal - total);

  const userTotal = totalInput === "" ? null : Number(fromAny(totalInput));
  const userChange = changeInput === "" ? null : Number(fromAny(changeInput));

  const totalState: "empty" | "ok" | "bad" =
    totalInput === "" ? "empty" : userTotal === total ? "ok" : "bad";
  const changeState: "empty" | "ok" | "bad" =
    changeInput === ""
      ? "empty"
      : paid.length > 0 && userChange === expectedChange
        ? "ok"
        : "bad";

  const expectedCmp: "<" | ">" | "=" =
    paidTotal < total ? "<" : paidTotal > total ? ">" : "=";
  const cmpState: "empty" | "ok" | "bad" =
    cmpAnswer === null ? "empty" : cmpAnswer === expectedCmp ? "ok" : "bad";

  const allCorrect =
    totalState === "ok" && changeState === "ok" && paidTotal >= total;

  useEffect(() => {
    if (allCorrect && !tadaPlayed.current) {
      tadaPlayed.current = true;
      playTada();
      setShowFw(true);
      setTimeout(() => setShowFw(false), 1300);
    }
  }, [allCorrect]);

  function addMoney(c: number) {
    setPaid((p) => [...p, c]);
  }
  function removeMoney(i: number) {
    setPaid((p) => p.filter((_, idx) => idx !== i));
  }
  function next() {
    if (allCorrect) setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
    else setScore((s) => ({ ...s, total: s.total + 1 }));
    setCart(newCart(minItems, maxItems, maxTotal));
    setPaid([]);
    setTotalInput("");
    setChangeInput("");
    setCmpAnswer(null);
    tadaPlayed.current = false;
  }

  const inputCls = (st: "empty" | "ok" | "bad") =>
    st === "ok"
      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
      : st === "bad"
        ? "border-red-500 bg-red-50 text-red-700"
        : "border-orange-300 bg-white text-gray-800";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 px-4 py-6">
      {showFw && <Fireworks />}
      {showAbacus && <AbacusWidget onClose={() => setShowAbacus(false)} />}

      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow hover:bg-gray-50"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-extrabold text-orange-900 sm:text-3xl">
            🛒 Little Cashier
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbacus((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold shadow ${
                showAbacus ? "bg-amber-600 text-white" : "bg-white text-amber-800"
              }`}
              title="Abacus"
            >
              <Calculator className="h-4 w-4" /> 🧮
            </button>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow">
              ⭐ {toLang(score.correct, lang)}/{toLang(score.total, lang)}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/70 p-3 shadow">
          <div className="flex gap-1 rounded-full bg-white p-1 shadow">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                lang === "en" ? "bg-orange-500 text-white" : "text-gray-500"
              }`}
            >
              123
            </button>
            <button
              type="button"
              onClick={() => setLang("ar")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                lang === "ar" ? "bg-orange-500 text-white" : "text-gray-500"
              }`}
            >
              ١٢٣
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            Min items:
            <input
              type="number"
              min={1}
              max={12}
              value={minItems}
              onChange={(e) => {
                const v = Math.max(1, Math.min(12, Number(e.target.value) || 1));
                setMinItems(v);
                if (v > maxItems) setMaxItems(v);
              }}
              className="w-16 rounded-lg border-2 border-orange-300 px-2 py-1 text-center font-extrabold"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            Max items:
            <input
              type="number"
              min={1}
              max={12}
              value={maxItems}
              onChange={(e) => {
                const v = Math.max(1, Math.min(12, Number(e.target.value) || 1));
                setMaxItems(Math.max(v, minItems));
              }}
              className="w-16 rounded-lg border-2 border-orange-300 px-2 py-1 text-center font-extrabold"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            Max total €:
            <input
              type="number"
              min={2}
              max={500}
              value={maxTotal}
              onChange={(e) => {
                const v = Math.max(2, Math.min(500, Number(e.target.value) || 2));
                setMaxTotal(v);
              }}
              className="w-20 rounded-lg border-2 border-orange-300 px-2 py-1 text-center font-extrabold"
            />
          </label>
          <button
            onClick={next}
            className="rounded-full bg-orange-500 px-4 py-1 text-sm font-bold text-white shadow hover:bg-orange-600"
          >
            🔄 New cart
          </button>
        </div>

        {/* 2. Cart - what to pay for */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-700">
            <ShoppingCart className="h-6 w-6 text-orange-600" /> Shopping cart
          </h2>
          <div className="flex flex-wrap gap-3">
            {cart.map((item, i) => (
              <div
                key={i}
                className="flex min-w-[110px] flex-col items-center gap-1 rounded-2xl bg-orange-50 p-3 shadow-inner"
              >
                <div className="text-5xl">{item.product.emoji}</div>
                <div className="text-sm font-semibold text-gray-700">{item.product.name}</div>
                <div className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-white">
                  {toLang(item.price, lang)} €
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Total to pay */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-2 flex items-center justify-center gap-2 text-emerald-700">
            <Receipt className="h-8 w-8" />
            <span className="text-lg font-bold">Total to pay</span>
            <span className="text-2xl">=</span>
            <span className="text-xl font-bold">€</span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            placeholder="?"
            className={`w-full rounded-2xl border-4 px-4 py-3 text-center text-3xl font-extrabold outline-none transition ${inputCls(totalState)}`}
          />
        </div>

        {/* 4. Customer paid */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-700">
              <Wallet className="h-6 w-6 text-blue-600" /> Customer paid
            </h2>
            <span className="text-xl font-extrabold text-blue-700">
              {toLang(paidTotal, lang)} €
            </span>
          </div>

          <div className="flex min-h-[70px] flex-wrap gap-2 rounded-2xl bg-gray-50 p-3">
            {paid.length === 0 && (
              <span className="text-sm text-gray-400">Tap money below to pay…</span>
            )}
            {paid.map((c, i) => {
              const s = moneyStyle(c);
              return (
                <button
                  key={i}
                  onClick={() => removeMoney(i)}
                  className={`flex h-12 w-14 items-center justify-center border-2 text-sm font-extrabold shadow ${s.cls} ${s.shape}`}
                  title="Tap to remove"
                >
                  {toLang(c, lang)}€
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 border-t-2 border-dashed border-gray-200 pt-4">
            {MONEY.map((c) => {
              const s = moneyStyle(c);
              return (
                <button
                  key={c}
                  onClick={() => addMoney(c)}
                  className={`flex h-16 w-20 items-center justify-center border-4 text-base font-extrabold shadow-lg transition active:scale-90 ${s.cls} ${s.shape}`}
                >
                  {toLang(c, lang)}€
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Change to return */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-2 flex items-center justify-center gap-2 text-purple-700">
            <HandCoins className="h-8 w-8" />
            <Coins className="h-6 w-6" />
            <span className="text-lg font-bold">Change to return</span>
            <span className="text-2xl">=</span>
            <span className="text-xl font-bold">€</span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={changeInput}
            onChange={(e) => setChangeInput(e.target.value)}
            placeholder="?"
            className={`w-full rounded-2xl border-4 px-4 py-3 text-center text-3xl font-extrabold outline-none transition ${inputCls(changeState)}`}
          />

          {allCorrect && (
            <div className="mt-4 rounded-xl bg-emerald-100 p-3 text-center text-lg font-bold text-emerald-800">
              🎉 Tada! Perfect!
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={next}
              className="flex-1 rounded-2xl bg-orange-500 py-3 text-lg font-extrabold text-white shadow-lg hover:bg-orange-600"
            >
              Next →
            </button>
            <button
              onClick={() => setPaid([])}
              disabled={paid.length === 0}
              className="rounded-2xl bg-gray-200 px-5 py-3 font-bold text-gray-700 shadow hover:bg-gray-300 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
