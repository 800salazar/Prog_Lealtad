"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginCustomer, type LoginState } from "@/app/[slug]/actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:brightness-90 disabled:opacity-60"
    >
      {pending ? "Buscando…" : "Ver mi tarjeta"}
    </button>
  );
}

export default function CustomerLoginForm({ slug }: { slug: string }) {
  const boundAction = loginCustomer.bind(null, slug);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Teléfono
        </span>
        <input
          name="phone"
          type="tel"
          placeholder="+52 555 123 4567"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
