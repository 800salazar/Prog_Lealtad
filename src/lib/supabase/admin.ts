import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con SERVICE ROLE KEY.
 *
 * ⚠️ Solo debe usarse en código de servidor (server actions, route handlers).
 * Ignora RLS, por eso nunca debe importarse en componentes de cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
