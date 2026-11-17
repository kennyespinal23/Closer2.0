import type { Translation } from "..";
import { app } from "./app";
import { today } from "./today";
import { explore } from "./explore";
import { saved } from "./saved";
import { you } from "./you";
import { firstRun } from "./firstRun";
import { community } from "./community";
import { bible } from "./bible";
import { lesson } from "./lesson";
import { blocks } from "./blocks";
import { mysteries } from "./mysteries";
import { books } from "./books";
import { psalms } from "./psalms";
import { connections } from "./connections";
import { lab } from "./lab";
import { theology } from "./theology";
import { science } from "./science";
import { history } from "./history";
import { heart } from "./heart";
import { poetry } from "./poetry";
import { native } from "./native";
import { collect } from "./collect";

/* Spanish. Mirrors en/, one file per area. Leave a string out (or empty) and English shows instead, so this can be
   filled in a little at a time. `npm run i18n` lists what's still missing. */
export const ES: Translation = { app, today, explore, saved, you, firstRun, community, bible, lesson, blocks, mysteries, books, psalms, connections, lab, theology, science, history, heart, poetry, native, collect };
