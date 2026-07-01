// Cliente Supabase — credenciais fixas do projeto
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qdzbqvazwaxthgijnpxz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5gIqrmnQCF0DPg3QOhLt5Q_8ArXqwDp";

let supabaseInstance: SupabaseClient | null = null;

/** Retorna o cliente Supabase (singleton) */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return supabaseInstance;
}
