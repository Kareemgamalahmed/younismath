import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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

// Whole-euro notes/coins available to pay with
const MONEY = [1, 2, 5, 10, 20, 50, 100];

function moneyColor(c: number) {
  if (c <= 2) return "bg-amber-200 text-amber-900 border-amber-400";
  if (c <= 10) return "bg-yellow-300 text-yellow-900 border-yellow-500";
  if (c <= 20) return "bg-emerald-200 text-emerald-900 border-emerald-500";
  return "bg-sky-200 text-sky-900 border-sky-500";
}

function newCart(maxItems: number) {
  const n = Math.max(1, 1 + Math.floor(Math.random() * maxItems));
  const cart: { product: Product; price: number }[] = [];
  const pool = [...PRODUCTS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) {
    const p = pool[i % pool.length];
    const price = 1 + Math.floor(Math.random() * 10); // 1..10 €
    cart.push({ product: p, price });
  }
  return cart;
}

function CashierPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [maxItems, setMaxItems] = useState(5);
  const [cart, setCart] = useState<{ product: Product; price: number }[]>([]);
  const [paid, setPaid] = useState<number[]>([]);
  const [totalInput, setTotalInput] = useState("");
  const [changeInput, setChangeInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    setCart(newCart(maxItems));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => cart.reduce((s, c) => s + c.price, 0), [cart]);
  const paidTotal = paid.reduce((s, c) => s + c, 0);
  const expectedChange = Math.max(0, paidTotal - total);

  const userTotal = Number(fromAny(totalInput));
  const userChange = Number(fromAny(changeInput));
  const totalOk = checked && totalInput !== "" && userTotal === total;
  const changeOk = checked && changeInput !== "" && userChange === expectedChange;

  function addMoney(c: number) {
    setPaid((p) => [...p, c]);
  }
  function removeMoney(i: number) {
    setPaid((p) => p.filter((_, idx) => idx !== i));
  }
  function check() {
    setChecked(true);
    const ok =
      totalInput !== "" &&
      changeInput !== "" &&
      userTotal === total &&
      userChange === expectedChange &&
      paidTotal >= total;
    if (ok) setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
  }
  function next() {
    if (checked && !(totalOk && changeOk)) {
      setScore((s) => ({ ...s, total: s.total + 1 }));
    }
    setCart(newCart(maxItems));
    setPaid([]);
    setTotalInput("");
    setChangeInput("");
    setChecked(false);
  }

  const allCorrect = totalOk && changeOk && paidTotal >= total;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 px-4 py-6">
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
          <div className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow">
            ⭐ {toLang(score.correct, lang)}/{toLang(score.total, lang)}
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
            Max items:
            <input
              type="number"
              min={1}
              max={12}
              value={maxItems}
              onChange={(e) => setMaxItems(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
              className="w-16 rounded-lg border-2 border-orange-300 px-2 py-1 text-center font-extrabold"
            />
          </label>
          <button
            onClick={next}
            className="rounded-full bg-orange-500 px-4 py-1 text-sm font-bold text-white shadow hover:bg-orange-600"
          >
            🔄 New cart
          </button>
        </div>

        {/* Cart */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="mb-3 text-lg font-bold text-gray-700">Shopping cart</h2>
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

        {/* Your answers */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-xl">
            <label className="mb-2 block text-lg font-bold text-gray-700">Total to pay (€)</label>
            <input
              type="text"
              inputMode="numeric"
              value={totalInput}
              onChange={(e) => {
                setTotalInput(e.target.value);
                setChecked(false);
              }}
              placeholder="?"
              className={`w-full rounded-2xl border-4 px-4 py-3 text-center text-3xl font-extrabold outline-none transition ${
                checked
                  ? totalOk
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-red-500 bg-red-50 text-red-700"
                  : "border-orange-300 bg-white text-gray-800"
              }`}
            />
            {checked && !totalOk && (
              <div className="mt-2 text-center text-sm font-bold text-red-600">
                Correct: {toLang(total, lang)} €
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-xl">
            <label className="mb-2 block text-lg font-bold text-gray-700">
              Change to give back (€)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={changeInput}
              onChange={(e) => {
                setChangeInput(e.target.value);
                setChecked(false);
              }}
              placeholder="?"
              className={`w-full rounded-2xl border-4 px-4 py-3 text-center text-3xl font-extrabold outline-none transition ${
                checked
                  ? changeOk
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-red-500 bg-red-50 text-red-700"
                  : "border-orange-300 bg-white text-gray-800"
              }`}
            />
            {checked && !changeOk && (
              <div className="mt-2 text-center text-sm font-bold text-red-600">
                Correct: {toLang(expectedChange, lang)} €
              </div>
            )}
          </div>
        </div>

        {/* Paid */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="mb-3 text-lg font-bold text-gray-700">You paid</h2>
          <div className="flex min-h-[70px] flex-wrap gap-2 rounded-2xl bg-gray-50 p-3">
            {paid.length === 0 && (
              <span className="text-sm text-gray-400">Tap notes below to pay…</span>
            )}
            {paid.map((c, i) => (
              <button
                key={i}
                onClick={() => removeMoney(i)}
                className={`flex h-12 w-14 items-center justify-center rounded-xl border-2 text-sm font-extrabold shadow ${moneyColor(
                  c,
                )}`}
                title="Tap to remove"
              >
                {toLang(c, lang)}€
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-600">Paid total</span>
            <span className="text-xl font-extrabold text-emerald-700">
              {toLang(paidTotal, lang)} €
            </span>
          </div>

          {checked && (
            <div
              className={`mt-3 rounded-xl p-3 text-center text-lg font-bold ${
                allCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {allCorrect
                ? "🎉 Perfect! Total and change are correct!"
                : paidTotal < total
                  ? `❌ Not enough paid — need ${toLang(total - paidTotal, lang)} € more`
                  : "❌ Check your numbers in red"}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {!checked || !allCorrect ? (
              <button
                onClick={check}
                className="flex-1 rounded-2xl bg-emerald-500 py-3 text-lg font-extrabold text-white shadow-lg hover:bg-emerald-600"
              >
                ✓ Check
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
              disabled={paid.length === 0}
              className="rounded-2xl bg-gray-200 px-5 py-3 font-bold text-gray-700 shadow hover:bg-gray-300 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Money */}
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <h2 className="mb-3 text-lg font-bold text-gray-700">Money</h2>
          <div className="flex flex-wrap gap-3">
            {MONEY.map((c) => (
              <button
                key={c}
                onClick={() => addMoney(c)}
                className={`flex h-16 w-20 items-center justify-center rounded-xl border-4 text-base font-extrabold shadow-lg transition active:scale-90 ${moneyColor(
                  c,
                )}`}
              >
                {toLang(c, lang)}€
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
