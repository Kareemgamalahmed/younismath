export type ModuleId = "math" | "arabic" | "trace" | "cashier" | "race" | "hidden" | "hour";

export const ALL_MODULES: { id: ModuleId; label: string }[] = [
  { id: "math", label: "Math" },
  { id: "arabic", label: "Arabic (عربي)" },
  { id: "trace", label: "Trace (كشكول)" },
  { id: "cashier", label: "Cashier" },
  { id: "race", label: "Race" },
  { id: "hidden", label: "Hidden Objects" },
  { id: "hour", label: "Hour (الساعه)" },
];

const KEY = "hidden_modules";

export function getHiddenModules(): ModuleId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as ModuleId[]) : [];
  } catch {
    return [];
  }
}

export function setHiddenModules(ids: ModuleId[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function isModuleHidden(id: ModuleId): boolean {
  return getHiddenModules().includes(id);
}
