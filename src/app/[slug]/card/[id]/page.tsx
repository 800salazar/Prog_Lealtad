import { notFound } from "next/navigation";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrDataUrl } from "@/lib/qr";
import { brandStyle } from "@/lib/theme";
import ProgressBar from "@/components/ProgressBar";
import WalletButtons from "@/components/WalletButtons";
import type { CustomerStats } from "@/types/database";

// Siempre datos frescos (visitas se actualizan desde el panel del negocio).
export const dynamic = "force-dynamic";

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_stats")
    .select("*")
    .eq("id", id)
    .single<CustomerStats>();

  // La tarjeta no existe, o el link no corresponde a este negocio.
  if (error || !data || data.business_slug !== slug) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const qrDataUrl = await generateQrDataUrl(`${appUrl}/${slug}/card/${data.id}`);
  const hasReward = data.available_rewards > 0;

  return (
    <main
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10"
      style={brandStyle(data.primary_color)}
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        {/* Encabezado */}
        <div className="bg-[var(--brand)] px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-widest text-white/70">
            {data.business_name} · Miembro #{data.member_no}
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            {data.first_name} {data.last_name}
          </h1>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Visitas acumuladas" value={data.total_visits} />
            <Stat
              label={data.reward_label}
              value={data.available_rewards}
              highlight={hasReward}
            />
          </div>

          {/* Recompensa disponible */}
          {hasReward && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-emerald-800">
              🎉 ¡Tienes {data.available_rewards}{" "}
              {data.reward_label.toLowerCase()}
              {data.available_rewards > 1 ? "s" : ""} para canjear!
            </div>
          )}

          {/* Progreso */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
              <span>Progreso al siguiente premio</span>
              <span className="font-medium">
                {data.visits_in_cycle}/{data.visits_required}
              </span>
            </div>
            <ProgressBar
              visitsInCycle={data.visits_in_cycle}
              visitsRequired={data.visits_required}
            />
            {data.visits_to_reward > 0 && (
              <p className="mt-2 text-center text-sm text-slate-500">
                Te faltan {data.visits_to_reward} visita
                {data.visits_to_reward > 1 ? "s" : ""} para tu próxima{" "}
                {data.reward_label.toLowerCase()}.
              </p>
            )}
          </div>

          {/* QR */}
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 p-5">
            <Image
              src={qrDataUrl}
              alt="Código QR de membresía"
              width={200}
              height={200}
              unoptimized
              className="rounded-lg"
            />
            <p className="text-xs text-slate-500">
              Muestra este código en caja
            </p>
          </div>

          {/* Apple / Google Wallet */}
          <WalletButtons customerId={data.id} />
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        highlight
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-3xl font-bold ${
          highlight ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
