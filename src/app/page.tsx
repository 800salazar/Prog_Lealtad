import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Únete al programa de lealtad
        </h1>
        <p className="mt-2 text-slate-600">
          Acumula visitas y gana tu recompensa. 🥤
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Eres del equipo?{" "}
        <Link href="/admin" className="font-medium text-slate-900 underline">
          Ir al panel
        </Link>
      </p>
    </main>
  );
}
