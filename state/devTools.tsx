import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Developer Tools provider.
 *
 * The Today screen ships with a small panel of internal QA shortcuts
 * (Next Sermon, Preview Shield, Start/End Dev Session, Reset / Restart
 * App). In a local-dev (`__DEV__`) build that panel renders
 * automatically. In a production-channel build it's hidden so end
 * users don't see it.
 *
 * That worked great until the team needed to QA a production-channel
 * install (TestFlight / internal distribution) — at which point there
 * was no way to surface the panel without a code change.
 *
 * This provider closes that gap. It persists a single boolean and
 * exposes a hook the Today screen can use to gate the dev panel:
 *
 *   const dev = useDevTools();
 *   if (__DEV__ || dev.enabled) { … }
 *
 * Default state:
 *   • `__DEV__` builds default to TRUE — local dev unaffected.
 *   • Production builds default to FALSE — clean for real users.
 *
 * The toggle is surfaced at Settings → Developer Tools. Teammates on
 * a production-channel install can flip it on once after install and
 * the dev panel will appear on Today; it persists across launches.
 */

const STORAGE_KEY = STORAGE_KEYS.devTools;

type DevToolsState = {
  /** True when the dev panel should render on Today. */
  enabled: boolean;
};

type DevToolsContextValue = DevToolsState & {
  setEnabled: (enabled: boolean) => void;
  /** True once persisted state has loaded (or no save existed). */
  hydrated: boolean;
};

/**
 * On a `__DEV__` build the panel is visible by default (matches the
 * pre-toggle behavior so nothing changes for local development). In a
 * production build the panel is hidden until a tester opts in.
 */
const DEFAULT: DevToolsState = {
  enabled: __DEV__,
};

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DevToolsState>(DEFAULT);

  const applyLoaded = useCallback((loaded: DevToolsState) => {
    // Defensive: if a future schema version adds fields, the saved
    // payload may be missing some — fall back to the default. The
    // saved `enabled` always wins (including when the user has
    // explicitly turned the panel OFF in a __DEV__ build).
    setState({
      enabled:
        typeof loaded.enabled === "boolean" ? loaded.enabled : DEFAULT.enabled,
    });
  }, []);

  const hydrated = usePersistence(STORAGE_KEY, state, applyLoaded);

  const setEnabled = useCallback((enabled: boolean) => {
    setState({ enabled });
  }, []);

  const value = useMemo<DevToolsContextValue>(
    () => ({ ...state, setEnabled, hydrated }),
    [state, setEnabled, hydrated],
  );

  return (
    <DevToolsContext.Provider value={value}>
      {children}
    </DevToolsContext.Provider>
  );
}

export function useDevTools(): DevToolsContextValue {
  const ctx = useContext(DevToolsContext);
  if (!ctx) {
    throw new Error("useDevTools must be used inside <DevToolsProvider>");
  }
  return ctx;
}
