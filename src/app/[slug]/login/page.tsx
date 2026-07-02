import Link from "next/link";
import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/business";
import { brandStyle } from "@/lib/theme";
import CustomerLoginForm from "@/components/CustomerLoginForm";

export const dynamic = "force-dynamic";

export default async function BusinessLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <main
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10"
      style={brandStyle(business.primary_color)}
    >
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[var(--brand)] px-6 py-6 text-center text-white">
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="mt-1 text-sm text-white/80">Ver mi tarjeta</p>
        </div>

        <div className="p-6">
          <CustomerLoginForm slug={slug} />
        </div>
      </div>

      <p className="text-center text-sm text-slate-500">
        ¿Aún no tienes tarjeta?{" "}
        <Link
          href={`/${slug}`}
          className="font-medium text-[var(--brand)] underline"
        >
          Regístrate
        </Link>
      </p>
    </main>
  );
}
