import type { Lesson } from "../../lesson/types";

/* Spanish lessons. Each one is a copy of its English file in content/ with the same id and the same blocks, the words
   translated. Register it here and it plays in Spanish; leave it out and the English one plays.

   For each lesson:
   - Scripture comes from a Spanish public-domain Bible, word for word, with its own `translation` name
     (for example "Reina-Valera 1909"), never translated from the English.
   - Page's lines are rewritten so they sound natural in Spanish, not translated word for word.
   - Poems are rewritten as Spanish poems.
   - Keep every {slot} (like {name} or {when}) exactly as it is.
   - Words inside an experience's own pieces (buttons, labels, hints) are in i18n/es/<area>.ts, not here. */
export const ES_LESSONS: Partial<Record<string, Lesson>> = {
};
