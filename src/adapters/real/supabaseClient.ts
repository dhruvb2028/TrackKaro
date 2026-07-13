import "react-native-url-polyfill/auto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * True only once a real sign-in has happened (Supabase auth.uid() exists).
 * Guests never have a Supabase session — this is the switch that keeps
 * guest writes on local storage even when Supabase is configured, since
 * RLS policies require user_id = auth.uid() (PRD §4.4 guest-first / §9
 * data isolation).
 */
export async function hasActiveSupabaseSession(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data } = await getSupabase().auth.getSession();
  return data.session !== null;
}

let client: SupabaseClient | null = null;

/** Lazily created — only ever called when isSupabaseConfigured() is true. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return client;
}
