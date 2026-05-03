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

export function Fireworks() {
  // returned as a component below
  return null;
}
