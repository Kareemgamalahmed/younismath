import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/cashier")({
  component: CashierPage,
});

type Product = { name: string; emoji: string; min: number; max: number };

const PRODUCTS: Product[] = [
  { name: "Milk", emoji: "🥛", min: 80, max: 250 },
  { name: "Eggs", emoji: "🥚", min: 100, max: 350 },
  { name: "Bread", emoji: "🍞", min: 50, max: 200 },
  { name: "Ice cream", emoji: "🍦", min: 150, max: 450 },
  { name: "Cheese", emoji: "🧀", min: 200, max: 600 },
  { name: "Apple", emoji: "🍎", min: 20, max: 90 },
  { name: "Banana", emoji: "🍌", min: 10, max: 60 },
  { name: "Chocolate", emoji: "🍫", min: 50, max: 250 },
  { name: "Juice", emoji: "🧃", min: 70, max: 200 },
  { name: "Cookies", emoji: "🍪", min: 100, max: 300 },
  { name: "Pizza", emoji: "🍕", min: 300, max: 900 },
  { name: "Water", emoji: "💧", min: 30, max: 120 },
];

// Money in cents
const COINS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

function fmt(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

function coinLabel(c: number) {
  if (c < 100) return `${c}¢`;
  return `${c / 100}€`;
}

function coinColor(c: number) {
  if (c < 100) return "bg-amber-200 text-amber-900 border-amber-400";
  if (c < 500) return "bg-yellow-300 text-yellow-900 border-yellow-500";
  if (c <= 2000) return "bg-emerald-200 text-emerald-900 border-emerald-500";
  return "bg-sky-200 text-sky-900 border-sky-500";
}

function pickRound(p: Product) {
  // round to nearest 5 cents
  const r = Math.floor(Math.random() * (p.max - p.min + 1)) + p.min;
  return Math.round(r / 5) * 5;
}

function newCart() {
  const n = 1 + Math.floor(Math.random() * 3); // 1-3 items
  const cart: { product: Product; price: number }[] = [];
  const pool = [...PRODUCTS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) {
    const p = pool[i];
    cart.push({ product: p, price: pickRound(p) });
  }
  return cart;
}

function CashierPage() {
  const [cart, setCart] = useState<{ product: Product; price: number }[]>([]);
  const [paid, setPaid] = useState<number[]>([]);
  const [result, setResult] = useState<"correct" | "less" | "more" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    setCart(newCart());
  }, []);

  const total = useMemo(() => cart.reduce((s, c) => s + c.price, 0), [cart]);
  const paidTotal = paid.reduce((s, c) => s + c, 0);

  function addCoin(c: number) {
    if (result) return;
    setPaid((p) => [...p, c]);
  }
  function removeCoin(i: number) {
    if (result) return;
    setPaid((p) => p.filter((_, idx) => idx !== i));
  }
  function check() {
    if (paidTotal === total) {
      setResult("correct");
      setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
    } else if (paidTotal < total) {
      setResult("less");
    } else {
      setResult("more");
    }
  }
  function next() {
    if (result !== "correct") {
      setScore((s) => ({ ...s, total: s.total + 1 }));
    }
    setCart(newCart());
    setPaid([]);
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow hover:bg-gray-50"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-extrabold text-orange-900 sm:text-3xl">
            🛒 Little Cashier
          </h1>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow">
            ⭐ {score.correct}/{score.total}
          </div>
        </div>

        {/* Cart */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="mb-3 text-lg font-bold text-gray-700">Shopping cart</h2>
          <div className="flex flex-wrap gap-3">
            {cart.map((item, i) => (
              <div
                key={i}
                className="flex min-w-[120px] flex-col items-center gap-1 rounded-2xl bg-orange-50 p-3 shadow-inner"
              >
                <div className="text-5xl">{item.product.emoji}</div>
                <div className="text-sm font-semibold text-gray-700">{item.product.name}</div>
                <div className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-white">
                  {fmt(item.price)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-lg font-bold text-gray-700">Total</span>
            <span className="text-2xl font-extrabold text-orange-700">{fmt(total)}</span>
          </div>
        </div>

        {/* Paid */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="mb-3 text-lg font-bold text-gray-700">You paid</h2>
          <div className="flex min-h-[70px] flex-wrap gap-2 rounded-2xl bg-gray-50 p-3">
            {paid.length === 0 && (
              <span className="text-sm text-gray-400">Tap coins below to pay…</span>
            )}
            {paid.map((c, i) => (
              <button
                key={i}
                onClick={() => removeCoin(i)}
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-extrabold shadow ${coinColor(
                  c,
                )}`}
                title="Tap to remove"
              >
                {coinLabel(c)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-600">Paid total</span>
            <span className="text-xl font-extrabold text-emerald-700">{fmt(paidTotal)}</span>
          </div>

          {result && (
            <div
              className={`mt-3 rounded-xl p-3 text-center text-lg font-bold ${
                result === "correct"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {result === "correct" && "🎉 Perfect! Exact amount!"}
              {result === "less" && `❌ Not enough — need ${fmt(total - paidTotal)} more`}
              {result === "more" && `❌ Too much — ${fmt(paidTotal - total)} extra`}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {!result ? (
              <button
                onClick={check}
                disabled={paid.length === 0}
                className="flex-1 rounded-2xl bg-emerald-500 py-3 text-lg font-extrabold text-white shadow-lg hover:bg-emerald-600 disabled:opacity-40"
              >
                ✓ Pay
              </button>
            ) : (
              <button
                onClick={next}
                className="flex-1 rounded-2xl bg-orange-500 py-3 text-lg font-extrabold text-white shadow-lg hover:bg-orange-600"
              >
                Next →
              </button>
            )}
            <button
              onClick={() => setPaid([])}
              disabled={!!result || paid.length === 0}
              className="rounded-2xl bg-gray-200 px-5 py-3 font-bold text-gray-700 shadow hover:bg-gray-300 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Coins */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="mb-3 text-lg font-bold text-gray-700">Money</h2>
          <div className="flex flex-wrap gap-3">
            {COINS.map((c) => (
              <button
                key={c}
                onClick={() => addCoin(c)}
                disabled={!!result}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-4 text-sm font-extrabold shadow-lg transition active:scale-90 disabled:opacity-50 ${coinColor(
                  c,
                )}`}
              >
                {coinLabel(c)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
