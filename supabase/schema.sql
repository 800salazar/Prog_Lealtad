-- =============================================================================
--  Programa de Lealtad — Esquema completo para Supabase / PostgreSQL
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- Extensión para gen_random_uuid()
create extension if not exists "pgcrypto";

-- =============================================================================
--  1. LOCATIONS (sucursales)
-- =============================================================================
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  created_at  timestamptz not null default now()
);

-- =============================================================================
--  2. CUSTOMERS (clientes)
--  member_no: número de miembro legible y secuencial (1001, 1002, ...)
--  id (uuid): identificador único usado en /card/[id] y en el QR.
-- =============================================================================
create sequence if not exists public.member_no_seq start 1001;

create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  member_no   integer not null unique default nextval('public.member_no_seq'),
  first_name  text not null,
  last_name   text not null,
  phone       text not null unique,
  birthday    date,
  created_at  timestamptz not null default now()
);

create index if not exists customers_phone_idx on public.customers (phone);

-- =============================================================================
--  3. VISITS (visitas acumuladas)
-- =============================================================================
create table if not exists public.visits (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  location_id  uuid references public.locations(id) on delete set null,
  created_at   timestamptz not null default now(),
  note         text
);

create index if not exists visits_customer_idx on public.visits (customer_id);

-- =============================================================================
--  4. REWARDS (recompensas)
--  Una recompensa se crea automáticamente cada 10 visitas (ver trigger).
--  status: 'available' | 'redeemed'
-- =============================================================================
create table if not exists public.rewards (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  type          text not null default 'free_drink',
  status        text not null default 'available' check (status in ('available','redeemed')),
  earned_at     timestamptz not null default now(),
  redeemed_at   timestamptz
);

create index if not exists rewards_customer_idx on public.rewards (customer_id);

-- =============================================================================
--  5. TRIGGER — genera 1 recompensa por cada 10 visitas
-- =============================================================================
create or replace function public.grant_reward_on_tenth_visit()
returns trigger
language plpgsql
security definer
as $$
declare
  total integer;
begin
  select count(*) into total
  from public.visits
  where customer_id = new.customer_id;

  -- Cada vez que el total es múltiplo de 10, otorgamos una bebida gratis.
  if total % 10 = 0 then
    insert into public.rewards (customer_id, type, status)
    values (new.customer_id, 'free_drink', 'available');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grant_reward on public.visits;
create trigger trg_grant_reward
  after insert on public.visits
  for each row
  execute function public.grant_reward_on_tenth_visit();

-- =============================================================================
--  6. VIEW — estadísticas por cliente (lo que consume la UI)
--  total_visits      : visitas totales
--  visits_in_cycle   : visitas dentro del ciclo actual (0..9)
--  visits_to_reward  : cuántas faltan para la siguiente recompensa
--  available_rewards : recompensas disponibles (no canjeadas)
-- =============================================================================
create or replace view public.customer_stats as
select
  c.id,
  c.member_no,
  c.first_name,
  c.last_name,
  c.phone,
  c.birthday,
  c.created_at,
  coalesce(v.total_visits, 0)                         as total_visits,
  coalesce(v.total_visits, 0) % 10                    as visits_in_cycle,
  (10 - (coalesce(v.total_visits, 0) % 10)) % 10      as visits_to_reward,
  coalesce(r.available_rewards, 0)                    as available_rewards
from public.customers c
left join (
  select customer_id, count(*) as total_visits
  from public.visits
  group by customer_id
) v on v.customer_id = c.id
left join (
  select customer_id, count(*) as available_rewards
  from public.rewards
  where status = 'available'
  group by customer_id
) r on r.customer_id = c.id;

-- =============================================================================
--  7. RLS (Row Level Security)
--  La app accede con la SERVICE ROLE KEY desde el servidor (server actions /
--  route handlers), que ignora RLS. Habilitamos RLS y NO creamos políticas
--  públicas: así el cliente anónimo no puede leer/escribir directamente.
--  Cuando migres a Supabase Auth podrás añadir políticas por usuario.
-- =============================================================================
alter table public.customers enable row level security;
alter table public.visits    enable row level security;
alter table public.rewards   enable row level security;
alter table public.locations enable row level security;

-- =============================================================================
--  8. SEED — una sucursal por defecto (opcional)
-- =============================================================================
insert into public.locations (name, address)
select 'Sucursal Principal', 'Dirección de tu negocio'
where not exists (select 1 from public.locations);
