"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegisterState = { error: string | null };

/** Normaliza un teléfono dejando solo dígitos y un + inicial opcional. */
function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

/**
 * Server action: registra un cliente nuevo.
 * Supabase genera el id (uuid) y el member_no automáticamente.
 */
export async function registerCustomer(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const phone = normalizePhone(String(formData.get("phone") || ""));
  const birthday = String(formData.get("birthday") || "").trim();

  if (!firstName || !lastName || !phone) {
    return { error: "Nombre, apellido y teléfono son obligatorios." };
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return { error: "El teléfono no parece válido." };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("customers")
    .insert({
      first_name: firstName,
      last_name: lastName,
      phone,
      birthday: birthday || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un cliente con ese teléfono." };
    }
    return { error: "No se pudo crear el registro. Intenta de nuevo." };
  }

  // Éxito: llevamos al cliente a su tarjeta digital.
  redirect(`/card/${data.id}`);
}
