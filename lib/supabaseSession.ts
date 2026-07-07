import { getSupabase } from "@/lib/supabase";

export async function signOutFromSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
