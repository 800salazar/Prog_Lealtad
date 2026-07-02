"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";

export type LoginState = { error: string | null };

/** Verifica la contraseña y abre sesión de admin. */
export async function loginAdmin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") || "");

  if (!process.env.ADMIN_PASSWORD) {
    return { error: "ADMIN_PASSWORD no está configurada en el servidor." };
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Contraseña incorrecta." };
  }

  const token = await adminToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 horas
  });

  redirect("/admin");
}

/** Cierra la sesión de admin. */
export async function logoutAdmin() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/** Registra una visita para un cliente. El trigger SQL otorga recompensas. */
export async function addVisit(formData: FormData) {
  const customerId = String(formData.get("customer_id") || "");
  const phone = String(formData.get("phone") || "");
  if (!customerId) return;

  const supabase = createAdminClient();
  await supabase.from("visits").insert({ customer_id: customerId });

  revalidatePath("/admin");
  // Volvemos al mismo cliente buscado.
  redirect(`/admin?phone=${encodeURIComponent(phone)}`);
}

/** Marca una recompensa disponible como canjeada. */
export async function redeemReward(formData: FormData) {
  const rewardId = String(formData.get("reward_id") || "");
  const phone = String(formData.get("phone") || "");
  if (!rewardId) return;

  const supabase = createAdminClient();
  await supabase
    .from("rewards")
    .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
    .eq("id", rewardId)
    .eq("status", "available");

  revalidatePath("/admin");
  redirect(`/admin?phone=${encodeURIComponent(phone)}`);
}
