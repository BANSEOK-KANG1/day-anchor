import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

export function createClient() {
  const url = isSupabaseConfigured() ? getSupabaseUrl()! : PLACEHOLDER_URL;
  const key = isSupabaseConfigured() ? getSupabaseAnonKey()! : PLACEHOLDER_KEY;

  return createBrowserClient(url, key);
}
