"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function AdminLoginPage() {
  const [state, formAction] = useActionState(loginAdmin, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Panel del equipo</h1>
        <p className="mb-5 text-sm text-slate-500">
          Ingresa la contraseña para continuar.
        </p>
        <form action={formAction} className="space-y-4">
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            autoFocus
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <SubmitButton />
        </form>
      </div>
    </main>
  );
}
