import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Plataforma de Tarjetas de Lealtad
      </h1>
      <p className="mt-3 text-slate-600">
        Cada negocio tiene su propio link de registro, por ejemplo{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
          tu-dominio.com/tu-negocio
        </code>
        . Si eres cliente, pide el link a tu negocio.
      </p>

      <p className="mt-6 text-sm text-slate-500">
        ¿Eres del equipo?{" "}
        <Link href="/admin" className="font-medium text-slate-900 underline">
          Ir al panel
        </Link>
      </p>
    </main>
  );
}
