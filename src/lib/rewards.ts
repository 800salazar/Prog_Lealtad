// Configuración de la lógica de lealtad.
// Desde el esquema multi-tenant, cada negocio define su propio
// `visits_required` (3–20) y `reward_label` en la tabla `businesses`.
// La fuente de verdad sigue siendo la vista `customer_stats`; estas
// utilidades solo sirven para recalcular en el cliente si hace falta.

export function computeProgress(totalVisits: number, visitsRequired: number) {
  const visitsInCycle = totalVisits % visitsRequired;
  const visitsToReward = (visitsRequired - visitsInCycle) % visitsRequired;
  const earnedRewards = Math.floor(totalVisits / visitsRequired);
  return { visitsInCycle, visitsToReward, earnedRewards };
}
