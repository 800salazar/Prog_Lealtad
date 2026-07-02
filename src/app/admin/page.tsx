import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { addVisit, redeemReward, logoutAdmin } from "@/app/admin/actions";
import type { CustomerStats, Visit, Reward } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;
  const query = (phone || "").trim();

  let customer: CustomerStats | null = null;
  let visits: Visit[] = [];
  let rewards: Reward[] = [];
  let notFound = false;

  if (query) {
    const supabase = createAdminClient();
    const digits = query.replace(/\D/g, "");

    const { data: match } = await supabase
      .from("customer_stats")
      .select("*")
      .ilike("phone", `%${digits}%`)
      .limit(1)
      .maybeSingle<CustomerStats>();

    if (match) {
      customer = match;
      const [{ data: v }, { data: r }] = await Promise.all([
        supabase
          .from("visits")
          .select("*")
          .eq("customer_id", match.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("rewards")
          .select("*")
          .eq("customer_id", match.id)
          .order("earned_at", { ascending: false }),
      ]);
      visits = (v as Visit[]) || [];
      rewards = (r as Reward[]) || [];
    } else {
      notFound = true;
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Panel del equipo</h1>
        <form action={logoutAdmin}>
          <button className="text-sm text-slate-500 underline">Salir</button>
        </form>
      </header>

      {/* Buscar por teléfono */}
      <form method="get" className="mb-6 flex gap-2">
        <input
          name="phone"
          defaultValue={query}
          placeholder="Buscar por teléfono…"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
        <button className="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700">
          Buscar
        </button>
      </form>

      {notFound && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-amber-800">
          No se encontró ningún cliente con ese teléfono.
        </p>
      )}

      {customer && (
        <div className="space-y-6">
          {/* Ficha del cliente */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Miembro #{customer.member_no}
                </p>
                <h2 className="text-xl font-bold text-slate-900">
                  {customer.first_name} {customer.last_name}
                </h2>
                <p className="text-sm text-slate-500">{customer.phone}</p>
              </div>
              <Link
                href={`/${customer.business_slug}/card/${customer.id}`}
                className="text-sm text-slate-600 underline"
                target="_blank"
              >
                Ver tarjeta
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <Metric label="Visitas" value={customer.total_visits} />
              <Metric
                label="Ciclo"
                value={`${customer.visits_in_cycle}/${customer.visits_required}`}
              />
              <Metric
                label={customer.reward_label}
                value={customer.available_rewards}
                highlight={customer.available_rewards > 0}
              />
            </div>

            {/* Acción: registrar visita */}
            <form action={addVisit} className="mt-5">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="phone" value={query} />
              <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500">
                + Registrar visita
              </button>
            </form>
          </section>

          {/* Recompensas */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-900">Recompensas</h3>
            {rewards.length === 0 ? (
              <p className="text-sm text-slate-500">Sin recompensas todavía.</p>
            ) : (
              <ul className="space-y-2">
                {rewards.map((reward) => (
                  <li
                    key={reward.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {customer.reward_label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {reward.status === "available"
                          ? "Disponible"
                          : `Canjeada ${formatDate(reward.redeemed_at)}`}
                      </p>
                    </div>
                    {reward.status === "available" ? (
                      <form action={redeemReward}>
                        <input type="hidden" name="reward_id" value={reward.id} />
                        <input type="hidden" name="phone" value={query} />
                        <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700">
                          Canjear
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-400">✓</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Historial de visitas */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-900">
              Historial de visitas
            </h3>
            {visits.length === 0 ? (
              <p className="text-sm text-slate-500">Sin visitas registradas.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visits.map((visit, i) => (
                  <li
                    key={visit.id}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="text-slate-700">
                      Visita #{visits.length - i}
                    </span>
                    <span className="text-slate-500">
                      {formatDate(visit.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200"
      }`}
    >
      <p
        className={`text-2xl font-bold ${
          highlight ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
