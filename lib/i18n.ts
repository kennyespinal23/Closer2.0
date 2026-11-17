import AsyncStorage from "@react-native-async-storage/async-storage";
import { setLocale, type Locale } from "@/lib/closer-page/i18n";

/* The app's words come from the same lists as the lesson page (copied into lib/closer-page/i18n by closer-page
   `npm run app`; edit them in the prototype, never here). Screens read them with useStrings().native.

   The language the person picked is kept on this phone. It stays English unless someone picks another one in the
   developer options: there's no automatic switch to the phone's language until the Spanish lists are written. The
   lesson web view is told the same language when it opens (app/lesson/[id].tsx). */

export { date, fill, locale, LOCALES, num, plural, setLocale, strings, tag, useLocale, useStrings, type Locale, type Plural } from "@/lib/closer-page/i18n";

/* Hermes here has no Intl.PluralRules (checked on the iOS Simulator, RN 0.81), and plural() needs it. English and
   Spanish both say "one" for exactly 1 and "other" for the rest in every count these lists use, so a tiny stand-in
   is enough. A third language with other plural forms would need a real polyfill (@formatjs/intl-pluralrules). */
const I = Intl as unknown as { PluralRules?: unknown };
if (typeof I.PluralRules !== "function") {
  I.PluralRules = class { select(n: number) { return n === 1 ? "one" : "other"; } };
}

const KEY = "closer:locale";
const isLocale = (s: unknown): s is Locale => s === "en" || s === "es" || s === "xx";

let restoring: Promise<void> | null = null;
/** Restore the saved language once, at launch (app/_layout.tsx). */
export function restoreLocale() {
  return (restoring ??= AsyncStorage.getItem(KEY).then(s => { if (isLocale(s)) setLocale(s); }).catch(() => {}));
}
/** Pick a language and remember it on this phone. */
export function chooseLocale(l: Locale) {
  setLocale(l);
  void AsyncStorage.setItem(KEY, l).catch(() => {});
}
