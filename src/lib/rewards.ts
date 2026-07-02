// Configuración de la lógica de lealtad en un solo lugar.
// Cambiar aquí afecta a toda la app (UI, trigger documentado en schema.sql).

export const VISITS_PER_REWARD = 10;
export const REWARD_LABEL = "Bebida gratis";

/**
 * Calcula el progreso a partir del total de visitas.
 * Devuelve valores derivados por si se quieren computar en el cliente
 * (la fuente de verdad sigue siendo la vista customer_stats).
 */
export function computeProgress(totalVisits: number) {
  const visitsInCycle = totalVisits % VISITS_PER_REWARD;
  const visitsToReward = (VISITS_PER_REWARD - visitsInCycle) % VISITS_PER_REWARD;
  const earnedRewards = Math.floor(totalVisits / VISITS_PER_REWARD);
  return { visitsInCycle, visitsToReward, earnedRewards };
}
