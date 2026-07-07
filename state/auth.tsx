import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  sendEmailSignInCode,
  verifyEmailSignInCode,
} from "@/lib/supabaseEmailAuth";
import { signOutFromSupabase } from "@/lib/supabaseSession";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type AuthContextValue = {
  /** Whether `EXPO_PUBLIC_SUPABASE_*` env vars are present. */
  configured: boolean;
  /** True once the initial session read (or skip) has finished. */
  hydrated: boolean;
  session: Session | null;
  user: User | null;
  signingIn: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [hydrated, setHydrated] = useState(!configured);
  const [session, setSession] = useState<Session | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setHydrated(true);
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setHydrated(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

  const signInWithApple = useCallback(async () => {
    setSigningIn(true);
    try {
      const { Platform } = await import("react-native");
      if (Platform.OS === "ios") {
        const { signInWithAppleNative } = await import("@/lib/supabaseAppleAuth");
        await signInWithAppleNative();
        return;
      }
      const { signInWithOAuthProvider } = await import("@/lib/supabaseOAuth");
      await signInWithOAuthProvider("apple");
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true);
    try {
      const { signInWithGoogleNative } = await import("@/lib/supabaseGoogleAuth");
      await signInWithGoogleNative();
    } finally {
      setSigningIn(false);
    }
  }, []);

  const sendEmailCode = useCallback(async (email: string) => {
    setSigningIn(true);
    try {
      await sendEmailSignInCode(email);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    setSigningIn(true);
    try {
      await verifyEmailSignInCode(email, code);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutFromSupabase();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      hydrated,
      session,
      user: session?.user ?? null,
      signingIn,
      signInWithApple,
      signInWithGoogle,
      sendEmailCode,
      verifyEmailCode,
      signOut,
    }),
    [
      configured,
      hydrated,
      session,
      signingIn,
      signInWithApple,
      signInWithGoogle,
      sendEmailCode,
      verifyEmailCode,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
