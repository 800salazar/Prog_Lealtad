// Autenticación mínima del panel /admin para el MVP.
// El cookie guarda un hash de ADMIN_PASSWORD (no la contraseña en claro).
// Cambiar la contraseña invalida las sesiones existentes.
//
// 👉 Para producción: migra a Supabase Auth con roles. Este helper es solo
//    una puerta simple para el MVP.

export const ADMIN_COOKIE = "admin_auth";

/** Token esperado = SHA-256 de la contraseña. Funciona en Edge y Node. */
export async function adminToken(): Promise<string> {
  const pwd = process.env.ADMIN_PASSWORD || "";
  const bytes = new TextEncoder().encode(`loyalty:${pwd}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
