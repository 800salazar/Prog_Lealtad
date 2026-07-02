// Tipos de la base de datos. Para un proyecto grande conviene generarlos con
// `supabase gen types typescript`, pero para el MVP los definimos a mano.

export type BusinessPlan = "trial" | "starter" | "pro" | "enterprise";
export type BusinessStatus = "active" | "past_due" | "canceled";
export type BusinessRole = "owner" | "staff";

export type Business = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  visits_required: number; // 3–20
  reward_label: string;
  plan: BusinessPlan;
  status: BusinessStatus;
  free_cards_quota: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

export type BusinessUser = {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessRole;
  created_at: string;
};

export type Customer = {
  id: string;
  business_id: string;
  member_no: number;
  first_name: string;
  last_name: string;
  phone: string;
  birthday: string | null;
  created_at: string;
};

export type Visit = {
  id: string;
  business_id: string;
  customer_id: string;
  location_id: string | null;
  created_at: string;
  note: string | null;
};

export type Reward = {
  id: string;
  business_id: string;
  customer_id: string;
  type: string;
  status: "available" | "redeemed";
  earned_at: string;
  redeemed_at: string | null;
};

export type Location = {
  id: string;
  business_id: string;
  name: string;
  address: string | null;
  created_at: string;
};

// Vista public.customer_stats
export type CustomerStats = {
  id: string;
  business_id: string;
  member_no: number;
  first_name: string;
  last_name: string;
  phone: string;
  birthday: string | null;
  created_at: string;
  business_slug: string;
  business_name: string;
  visits_required: number;
  reward_label: string;
  primary_color: string;
  secondary_color: string;
  total_visits: number;
  visits_in_cycle: number;
  visits_to_reward: number;
  available_rewards: number;
};
