import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client d'administration (clé service role) — contourne le RLS.
// À n'utiliser QUE dans du code serveur, après avoir vérifié que
// l'utilisateur courant est admin (voir lib/auth.ts).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
