import { useSyncExternalStore } from "react";
import { EN } from "./en";
import { ES } from "./es";

/* Closer's words, in one place per language.

   Every word the app shows that isn't lesson content lives in i18n/en/<area>.ts, grouped by screen. The Spanish list
   mirrors it in i18n/es/<area>.ts and may be partly empty: anything missing there falls back to English, so a half
   translated list never breaks a screen. Lesson content (Page's lines, verses, poems) lives in content/, and a Spanish
   lesson goes in content/es/ (see content/es/index.ts).

   How screens use it:
     const s = useStrings().today;            // inside a component; re-renders when the language changes
     <p>{s.title}</p>
     <p>{fill(s.streak, { n })}</p>           // "{n} day streak": named slots in braces
     <p>{plural(n, s.days)}</p>               // { one: "{n} day", other: "{n} days" }: Spanish has the same two forms
     strings().today.title                    // outside React (never at module level: it would miss a language change)

   Rules for the lists, so they translate well:
   - Whole sentences, never pieces glued together in code. Put the moving part in a {slot}.
   - Every count goes through plural(), never `n === 1 ? "" : "s"`.
   - Dates go through date(), so the month names and order follow the language.
   - Comments above a string say where it shows and anything a translator needs (tone, length, what {slots} hold).

   The "xx" language is test text: every listed string comes out accented and about a third longer, like
   "[Ţőđåý ~~~]". Anything still in plain English on screen is hard-coded and hasn't moved into a list yet, and anything
   cut off shows where longer Spanish wouldn't fit. Pick it in the testing panel. */

export type Locale = "en" | "es" | "xx";
export const LOCALES: { id: Locale; name: string; test?: boolean }[] = [
  { id: "en", name: "English" },
  { id: "es", name: "Español" },
  { id: "xx", name: "Test text", test: true },
];

export type Strings = typeof EN;
export type Plural = { one: string; other: string };
type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };
export type Translation = DeepPartial<Strings>;

const KEY = "closer-page:locale";
type W = Window & { __CLOSER_APP__?: { locale?: string } };
const isLocale = (s: unknown): s is Locale => s === "en" || s === "es" || s === "xx";

let current: Locale = (() => {
  const app = typeof window !== "undefined" ? (window as W).__CLOSER_APP__?.locale : undefined;
  if (isLocale(app)) return app;
  try { const s = localStorage.getItem(KEY); if (isLocale(s)) return s; } catch { /* private mode */ }
  return "en";
})();
const listeners = new Set<() => void>();

function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object") return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    if (Array.isArray(b)) out[k] = Array.isArray(v) && v.length === b.length ? b.map((x, i) => (typeof x === "string" ? (typeof v[i] === "string" && v[i].trim() ? v[i] : x) : merge(x, v[i]))) : b;
    else if (typeof v === "string" && v.trim() && typeof b === "string") out[k] = v;
    else if (v && typeof v === "object" && b && typeof b === "object") out[k] = merge(b, v);
  }
  return out as T;
}

/* test text: accents every letter, keeps {slots} as they are, and pads by about a third */
const ACCENT: Record<string, string> = { a: "å", b: "ƀ", c: "ç", d: "đ", e: "é", g: "ğ", h: "ħ", i: "í", k: "ķ", l: "ľ", n: "ñ", o: "ő", r: "ŕ", s: "š", t: "ţ", u: "ü", y: "ý", z: "ž", A: "Å", C: "Ç", D: "Đ", E: "É", G: "Ğ", I: "Í", L: "Ľ", N: "Ñ", O: "Ő", R: "Ŕ", S: "Š", T: "Ţ", U: "Ü", Y: "Ý", Z: "Ž" };
function pseudo(s: string): string {
  const body = s.split(/(\{[^}]+\})/).map(p => (p.startsWith("{") ? p : p.replace(/[a-zA-Z]/g, c => ACCENT[c] ?? c))).join("");
  return `[${body} ${"~".repeat(Math.max(1, Math.ceil(s.length * 0.3)))}]`;
}
function mapStrings<T>(o: T, f: (s: string) => string): T {
  if (typeof o === "string") return f(o) as T;
  if (Array.isArray(o)) return o.map(x => mapStrings(x, f)) as T;
  if (o && typeof o === "object") return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, mapStrings(v, f)])) as T;
  return o;
}

const built: Partial<Record<Locale, Strings>> = {};
function build(l: Locale): Strings {
  return (built[l] ??= l === "es" ? merge(EN, ES) : l === "xx" ? mapStrings(EN, pseudo) : EN);
}

export const locale = () => current;
/** BCP 47 tag for dates and numbers */
export const tag = () => (current === "es" ? "es-US" : "en-US");
export const strings = (): Strings => build(current);

export function setLocale(l: Locale) {
  if (l === current) return;
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* private mode: this visit only */ }
  if (typeof document !== "undefined") document.documentElement.lang = l === "xx" ? "en" : l;
  listeners.forEach(f => f());
}
function subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }
export const useLocale = () => useSyncExternalStore(subscribe, () => current, () => current);
export function useStrings(): Strings { useLocale(); return build(current); }

/** "{n} days left" + {n: 3} → "3 days left". Unknown slots are left visible, so a mistake shows instead of vanishing. */
export function fill(s: string, vars: Record<string, string | number> = {}): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
const rules: Partial<Record<string, Intl.PluralRules>> = {};
/** picks one or other by the language's own plural rule, then fills {n} and any other slots */
export function plural(n: number, p: Plural, vars: Record<string, string | number> = {}): string {
  // Hermes in the app can start without Intl.PluralRules; English and Spanish both use "one" for exactly 1
  const r = typeof Intl !== "undefined" && "PluralRules" in Intl ? (rules[tag()] ??= new Intl.PluralRules(tag())).select(n) : n === 1 ? "one" : "other";
  return fill(r === "one" ? p.one : p.other, { n, ...vars });
}
/** a date in the current language: date(d, { month: "long", day: "numeric" }) */
export const date = (d: Date | number, o: Intl.DateTimeFormatOptions) => new Date(d).toLocaleDateString(tag(), o);
/** a number with the language's own separators (1,000 / 1.000) */
export const num = (n: number, o?: Intl.NumberFormatOptions) => n.toLocaleString(tag(), o);
