/* Experiences built in their own files. Each module adds its block kinds here; nothing else is shared. */
import type { Blocks as Atone } from "./atone.types";
import type { Blocks as FreeWill } from "./freewill.types";
import type { Blocks as Spirit } from "./spirit.types";
import type { Blocks as EarthAge } from "./earth.types";
import type { Blocks as Evolution } from "./evo.types";
import type { Blocks as FineTuning } from "./tune.types";
import type { Blocks as HistBible } from "./hbible.types";
import type { Blocks as HistFirst } from "./hfirst.types";
import type { Blocks as HistSplit } from "./hsplit.types";
import type { Blocks as HeartClose } from "./hclose.types";
import type { Blocks as HeartAfraid } from "./hafraid.types";
import type { Blocks as HeartLately } from "./hlately.types";
import type { Blocks as Reminder } from "./remind.types";
import type { Blocks as PoemLoved } from "./ploved.types";
import type { Blocks as PoemFar } from "./pfar.types";
import type { Blocks as PoemToday } from "./ptoday.types";
export type ExtBlock = PoemToday | PoemFar | PoemLoved | Reminder | HeartLately | HeartAfraid | HeartClose | HistSplit | HistFirst | HistBible | Atone | FreeWill | Spirit | EarthAge | Evolution | FineTuning;
