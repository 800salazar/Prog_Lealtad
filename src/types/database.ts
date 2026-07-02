// Tipos de la base de datos. Para un proyecto grande conviene generarlos con
// `supabase gen types typescript`, pero para el MVP los definimos a mano.

export type Customer = {
  id: string;
  member_no: number;
  first_name: string;
  last_name: string;
  phone: string;
  birthday: string | null;
  created_at: string;
};

export type Visit = {
  id: string;
  customer_id: string;
  location_id: string | null;
  created_at: string;
  note: string | null;
};

export type Reward = {
  id: string;
  customer_id: string;
  type: string;
  status: "available" | "redeemed";
  earned_at: string;
  redeemed_at: string | null;
};

export type Location = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
};

// Vista public.customer_stats
export type CustomerStats = {
  id: string;
  member_no: number;
  first_name: string;
  last_name: string;
  phone: string;
  birthday: string | null;
  created_at: string;
  total_visits: number;
  visits_in_cycle: number;
  visits_to_reward: number;
  available_rewards: number;
};
