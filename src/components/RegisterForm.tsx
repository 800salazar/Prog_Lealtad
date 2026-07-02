"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerCustomer, type RegisterState } from "@/app/[slug]/actions";

const initialState: RegisterState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:brightness-90 disabled:opacity-60"
    >
      {pending ? "Creando tu tarjeta…" : "Crear mi tarjeta"}
    </button>
  );
}

export default function RegisterForm({ slug }: { slug: string }) {
  const boundAction = registerCustomer.bind(null, slug);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" name="first_name" placeholder="Ana" required />
        <Field label="Apellido" name="last_name" placeholder="García" required />
      </div>

      <Field
        label="Teléfono"
        name="phone"
        type="tel"
        placeholder="+52 555 123 4567"
        required
      />

      <Field label="Fecha de cumpleaños" name="birthday" type="date" />

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />
    </label>
  );
}
