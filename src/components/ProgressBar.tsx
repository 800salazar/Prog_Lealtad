import { VISITS_PER_REWARD } from "@/lib/rewards";

/** Muestra el progreso del ciclo actual como puntos + barra. */
export default function ProgressBar({ visitsInCycle }: { visitsInCycle: number }) {
  const pct = (visitsInCycle / VISITS_PER_REWARD) * 100;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {Array.from({ length: VISITS_PER_REWARD }).map((_, i) => (
          <span
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              i < visitsInCycle
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
