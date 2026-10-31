export type Lang = "en" | "ar";

export const AR_DIGITS = ["Ù ", "Ù¡", "Ù¢", "Ù£", "Ù¤", "Ù¥", "Ù¦", "Ù§", "Ù¨", "Ù©"];

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


// --- Race time limit / lockout (localStorage-backed, SSR-safe) ---
//
// Model: the parent sets a play budget (minutes) and a lock duration (hours).
// Play time is counted while a run is active. When the budget is used up the
// game locks until `lockedUntil`; when that moment passes, the lock clears and
// the budget refills. The toggle turns the whole thing off (always open).
// NOTE: this lives in the browser, so it is a soft gate, not tamper-proof.

function numOr(raw: string | null, fallback: number, min: number): number {
  const n = Number(raw);
  return raw !== null && Number.isFinite(n) && n >= min ? n : fallback;
}

export function getRaceLimitEnabled(): boolean {
  return lsGet("kid_race_limit_enabled") !== "0"; // default: ON
}
export function setRaceLimitEnabled(b: boolean) {
  lsSet("kid_race_limit_enabled", b ? "1" : "0");
}

export function getRacePlayMinutes(): number {
  return numOr(lsGet("kid_race_play_minutes"), 10, 1);
}
export function setRacePlayMinutes(n: number) {
  if (Number.isFinite(n) && n >= 1) lsSet("kid_race_play_minutes", String(n));
}

export function getRaceLockHours(): number {
  return numOr(lsGet("kid_race_lock_hours"), 24, 0.01);
}
export function setRaceLockHours(n: number) {
  if (Number.isFinite(n) && n > 0) lsSet("kid_race_lock_hours", String(n));
}

export function getRacePlayedSeconds(): number {
  return numOr(lsGet("kid_race_played_seconds"), 0, 0);
}
export function setRacePlayedSeconds(n: number) {
  lsSet("kid_race_played_seconds", String(Math.max(0, n)));
}

export function getRaceLockedUntil(): number {
  return numOr(lsGet("kid_race_locked_until"), 0, 0);
}
export function setRaceLockedUntil(ms: number) {
  lsSet("kid_race_locked_until", String(Math.max(0, ms)));
}

export type RaceLockStatus = {
  locked: boolean;
  unlimited: boolean;
  remainingPlaySeconds: number;
  lockedUntil: number;
};

/** Current access status. Auto-clears an expired lock and refills the budget. */
export function raceLockStatus(): RaceLockStatus {
  if (!getRaceLimitEnabled()) {
    return { locked: false, unlimited: true, remainingPlaySeconds: Infinity, lockedUntil: 0 };
  }
  const now = Date.now();
  let lockedUntil = getRaceLockedUntil();
  if (lockedUntil && now >= lockedUntil) {
    // lock expired -> new window
    setRaceLockedUntil(0);
    setRacePlayedSeconds(0);
    lockedUntil = 0;
  }
  if (lockedUntil && now < lockedUntil) {
    return { locked: true, unlimited: false, remainingPlaySeconds: 0, lockedUntil };
  }
  const budget = getRacePlayMinutes() * 60;
  const used = getRacePlayedSeconds();
  if (used >= budget) {
    // Budget is already spent (e.g. the parent lowered the minutes): lock now.
    lockedUntil = now + getRaceLockHours() * 3600 * 1000;
    setRaceLockedUntil(lockedUntil);
    return { locked: true, unlimited: false, remainingPlaySeconds: 0, lockedUntil };
  }
  return { locked: false, unlimited: false, remainingPlaySeconds: budget - used, lockedUntil: 0 };
}

/** Add played time. Trips the lock when the budget is exhausted. Returns fresh status. */
export function addRacePlaySeconds(delta: number): RaceLockStatus {
  if (getRaceLimitEnabled() && delta > 0) {
    const status = raceLockStatus();
    if (!status.locked) setRacePlayedSeconds(getRacePlayedSeconds() + delta);
  }
  return raceLockStatus();
}

/** Parent override: clear any lock and refill the budget. */
export function resetRaceLimit() {
  setRaceLockedUntil(0);
  setRacePlayedSeconds(0);
}

/** "2h 05m 09s" / "4m 07s" / "9s" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(sec)}s`;
  if (m > 0) return `${m}m ${pad(sec)}s`;
  return `${sec}s`;
}
