import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Safe client — won't crash during static build if env vars are missing.
// At runtime in the browser, the real values are always present.
export const supabase = createClient(
  supabaseUrl || "https://tnryzcahwfwyqyezdgdz.supabase.co",
  supabaseAnonKey || "sb_publishable_Pq3vlwurV7wH2kIDXttYpw_mH4MX-tu"
);