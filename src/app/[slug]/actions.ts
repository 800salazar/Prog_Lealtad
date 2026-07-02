"use server";

import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessBySlug } from "@/lib/business";

export type RegisterState = { error: string | null };
export type LoginState = { error: string | null };

/** Normaliza un teléfono dejando solo dígitos y un + inicial opcional. */
function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

/**
 * Server action: registra un cliente nuevo para el negocio identificado
 * por `slug` (empresa.com/<slug>). El negocio queda asignado de forma
 * automática — el usuario nunca tiene que buscarlo.
 */
export async function registerCustomer(
  slug: string,
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  if (business.status !== "active") {
    return { error: "Este negocio no está disponible en este momento." };
  }

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
      business_id: business.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      birthday: birthday || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un cliente con ese teléfono en este negocio." };
    }
    return { error: "No se pudo crear el registro. Intenta de nuevo." };
  }

  redirect(`/${slug}/card/${data.id}`);
}

/**
 * Server action: "inicio de sesión" del cliente — no requiere contraseña,
 * solo su teléfono. Lo redirige a su tarjeta dentro del negocio `slug`.
 */
export async function loginCustomer(
  slug: string,
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const phone = normalizePhone(String(formData.get("phone") || ""));
  if (!phone) {
    return { error: "Ingresa tu teléfono." };
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("business_id", business.id)
    .eq("phone", phone)
    .maybeSingle();

  if (!data) {
    return { error: "No encontramos una tarjeta con ese teléfono." };
  }

  redirect(`/${slug}/card/${data.id}`);
}
