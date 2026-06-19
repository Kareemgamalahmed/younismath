export type Lang = "en" | "ar";

export const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toLang(n: number | string, lang: Lang) {
  const s = String(n);
  if (lang === "en") return s;
  return s
    .split("")
    .map((c) => (/\d/.test(c) ? AR_DIGITS[Number(c)] : c))
    .join("");
}

export function fromAny(s: string) {
  return s
    .split("")
    .map((c) => {
      const i = AR_DIGITS.indexOf(c);
      return i >= 0 ? String(i) : c;
    })
    .join("")
    .replace(/[^\d-]/g, "");
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("kid_session_id");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    localStorage.setItem("kid_session_id", id);
  }
  return id;
}


// --- Race / car helpers (localStorage-backed, SSR-safe) ---

export type SpeedLevel = "green" | "yellow" | "orange" | "red";

const DEFAULT_FACTORS: Record<SpeedLevel, number> = {
  green: 1.1,
  yellow: 1.4,
  orange: 1.7,
  red: 2.0,
};

function lsGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, val: string) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, val); } catch {}
}

export function getCarColor(): string {
  return lsGet("kid_car_color") || "#2563eb";
}
export function setCarColor(hex: string) {
  lsSet("kid_car_color", hex);
}

export function getSpeedLevel(): SpeedLevel {
  const v = lsGet("kid_speed_level");
  if (v === "green" || v === "yellow" || v === "orange" || v === "red") return v;
  return "green";
}
export function setSpeedLevel(level: SpeedLevel) {
  lsSet("kid_speed_level", level);
}

export function getSpeedFactors(): Record<SpeedLevel, number> {
  const raw = lsGet("kid_speed_factors");
  if (!raw) return { ...DEFAULT_FACTORS };
  try {
    const obj = JSON.parse(raw);
    return {
      green: Number(obj.green) || DEFAULT_FACTORS.green,
      yellow: Number(obj.yellow) || DEFAULT_FACTORS.yellow,
      orange: Number(obj.orange) || DEFAULT_FACTORS.orange,
      red: Number(obj.red) || DEFAULT_FACTORS.red,
    };
  } catch {
    return { ...DEFAULT_FACTORS };
  }
}
export function setSpeedFactors(obj: Record<SpeedLevel, number>) {
  lsSet("kid_speed_factors", JSON.stringify(obj));
}

export function getRaceHiScore(): number {
  return Number(lsGet("kid_race_hiscore")) || 0;
}
export function setRaceHiScore(n: number) {
  lsSet("kid_race_hiscore", String(n));
}
