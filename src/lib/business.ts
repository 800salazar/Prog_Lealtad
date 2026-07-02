import { createAdminClient } from "@/lib/supabase/admin";
import type { Business } from "@/types/database";

/**
 * Slugs que no pueden usarse como identificador de negocio porque chocan
 * con rutas propias de la app (debe coincidir con el CHECK en schema.sql).
 */
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "card",
  "login",
  "logout",
  "dashboard",
  "b",
  "app",
  "www",
  "assets",
  "static",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
  "wallet",
  "signup",
  "signin",
  "register",
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/** Busca un negocio por su slug público (empresa.com/<slug>). */
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  if (isReservedSlug(slug)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single<Business>();

  if (error || !data) return null;
  return data;
}
