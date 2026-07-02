-- =============================================================================
--  Programa de Lealtad — Esquema MULTI-TENANT para Supabase / PostgreSQL
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--
--  Este esquema asume un proyecto de Supabase NUEVO (sin las tablas del MVP
--  single-tenant anterior). Si vienes del esquema viejo (una sola tarjeta),
--  corre esto en un proyecto limpio: no migra datos existentes.
-- =============================================================================

-- Extensión para gen_random_uuid()
create extension if not exists "pgcrypto";

-- =============================================================================
--  1. BUSINESSES (negocios / tenants)
--  Cada negocio define su propia tarjeta: cuántas visitas requiere el premio
--  (entre 3 y 20), el nombre del premio y su marca (logo + colores).
-- =============================================================================
create table if not exists public.businesses (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  logo_url              text,
  primary_color         text not null default '#0f172a',
  secondary_color       text not null default '#ffffff',
  visits_required       integer not null default 10
                          check (visits_required between 3 and 20),
  reward_label          text not null default 'Recompensa',
  plan                  text not null default 'trial'
                          check (plan in ('trial','starter','pro','enterprise')),
  status                text not null default 'active'
                          check (status in ('active','past_due','canceled')),
  free_cards_quota      integer not null default 50,
  stripe_customer_id    text,
  stripe_subscription_id text,
  created_at            timestamptz not null default now()
);

create index if not exists businesses_slug_idx on public.businesses (slug);

-- =============================================================================
--  2. BUSINESS_USERS (miembros del negocio con acceso al panel)
--  Vincula usuarios de Supabase Auth (auth.users) con un negocio y un rol.
--  Se llenará cuando se implemente el login de negocios (módulo B3).
-- =============================================================================
create table if not exists public.business_users (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'owner' check (role in ('owner','staff')),
  created_at   timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_users_user_idx on public.business_users (user_id);

-- =============================================================================
--  3. LOCATIONS (sucursales) — por negocio
-- =============================================================================
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  address     text,
  created_at  timestamptz not null default now()
);

create index if not exists locations_business_idx on public.locations (business_id);

-- =============================================================================
--  4. CUSTOMERS (clientes) — por negocio
--  member_no: número de miembro legible, secuencial *dentro de cada negocio*
--  (1001, 1002, ...). id (uuid): identificador único usado en /card/[id].
--  El mismo teléfono puede existir en negocios distintos (unique compuesto).
-- =============================================================================
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  member_no   integer,
  first_name  text not null,
  last_name   text not null,
  phone       text not null,
  birthday    date,
  created_at  timestamptz not null default now(),
  unique (business_id, phone)
);

create index if not exists customers_business_idx on public.customers (business_id);
create index if not exists customers_phone_idx on public.customers (phone);

-- Asigna member_no correlativo (1001, 1002...) dentro del negocio del cliente.
create or replace function public.set_customer_member_no()
returns trigger
language plpgsql
as $$
begin
  if new.member_no is null then
    select coalesce(max(member_no), 1000) + 1
      into new.member_no
      from public.customers
      where business_id = new.business_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_member_no on public.customers;
create trigger trg_set_member_no
  before insert on public.customers
  for each row
  execute function public.set_customer_member_no();

-- =============================================================================
--  5. VISITS (visitas acumuladas) — business_id denormalizado para RLS simple
-- =============================================================================
create table if not exists public.visits (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  customer_id  uuid not null references public.customers(id) on delete cascade,
  location_id  uuid references public.locations(id) on delete set null,
  created_at   timestamptz not null default now(),
  note         text
);

create index if not exists visits_customer_idx on public.visits (customer_id);
create index if not exists visits_business_idx on public.visits (business_id);

-- Si no se envía business_id explícito, lo toma del cliente.
create or replace function public.set_visit_business_id()
returns trigger
language plpgsql
as $$
begin
  if new.business_id is null then
    select business_id into new.business_id
      from public.customers
      where id = new.customer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_visit_business_id on public.visits;
create trigger trg_set_visit_business_id
  before insert on public.visits
  for each row
  execute function public.set_visit_business_id();

-- =============================================================================
--  6. REWARDS (recompensas)
--  Se crea automáticamente cada `visits_required` visitas (config. por negocio).
--  status: 'available' | 'redeemed'
-- =============================================================================
create table if not exists public.rewards (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  type          text not null default 'reward',
  status        text not null default 'available' check (status in ('available','redeemed')),
  earned_at     timestamptz not null default now(),
  redeemed_at   timestamptz
);

create index if not exists rewards_customer_idx on public.rewards (customer_id);
create index if not exists rewards_business_idx on public.rewards (business_id);

-- =============================================================================
--  7. TRIGGER — genera 1 recompensa cada `visits_required` visitas del negocio
-- =============================================================================
create or replace function public.grant_reward_on_target_visit()
returns trigger
language plpgsql
security definer
as $$
declare
  total           integer;
  target_visits   integer;
begin
  select visits_required into target_visits
    from public.businesses
    where id = new.business_id;

  select count(*) into total
    from public.visits
    where customer_id = new.customer_id;

  if target_visits is not null and target_visits > 0 and total % target_visits = 0 then
    insert into public.rewards (business_id, customer_id, type, status)
    values (new.business_id, new.customer_id, 'reward', 'available');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_grant_reward on public.visits;
create trigger trg_grant_reward
  after insert on public.visits
  for each row
  execute function public.grant_reward_on_target_visit();

-- =============================================================================
--  8. VIEW — estadísticas por cliente (lo que consume la UI)
--  total_visits      : visitas totales
--  visits_in_cycle   : visitas dentro del ciclo actual (0..visits_required-1)
--  visits_to_reward  : cuántas faltan para la siguiente recompensa
--  available_rewards : recompensas disponibles (no canjeadas)
-- =============================================================================
create or replace view public.customer_stats as
select
  c.id,
  c.business_id,
  c.member_no,
  c.first_name,
  c.last_name,
  c.phone,
  c.birthday,
  c.created_at,
  b.slug                                                        as business_slug,
  b.name                                                         as business_name,
  b.visits_required,
  b.reward_label,
  b.primary_color,
  b.secondary_color,
  coalesce(v.total_visits, 0)                                   as total_visits,
  coalesce(v.total_visits, 0) % b.visits_required                as visits_in_cycle,
  (b.visits_required - (coalesce(v.total_visits, 0) % b.visits_required))
    % b.visits_required                                         as visits_to_reward,
  coalesce(r.available_rewards, 0)                              as available_rewards
from public.customers c
join public.businesses b on b.id = c.business_id
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
--  9. RLS (Row Level Security)
--  Los server actions/route handlers actuales usan la SERVICE ROLE KEY, que
--  ignora RLS. Estas políticas dejan preparado el acceso por negocio para
--  cuando el panel use sesiones de Supabase Auth (módulo B3) desde el cliente.
-- =============================================================================

-- Negocios a los que pertenece el usuario autenticado actual.
create or replace function public.my_business_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select business_id from public.business_users where user_id = auth.uid();
$$;

alter table public.businesses     enable row level security;
alter table public.business_users enable row level security;
alter table public.customers      enable row level security;
alter table public.visits         enable row level security;
alter table public.rewards        enable row level security;
alter table public.locations      enable row level security;

drop policy if exists biz_select_own on public.businesses;
create policy biz_select_own on public.businesses
  for select using (id in (select public.my_business_ids()));

drop policy if exists biz_update_own on public.businesses;
create policy biz_update_own on public.businesses
  for update using (id in (select public.my_business_ids()));

drop policy if exists biz_users_select_own on public.business_users;
create policy biz_users_select_own on public.business_users
  for select using (
    user_id = auth.uid()
    or business_id in (select public.my_business_ids())
  );

drop policy if exists customers_tenant_access on public.customers;
create policy customers_tenant_access on public.customers
  for all using (business_id in (select public.my_business_ids()));

drop policy if exists visits_tenant_access on public.visits;
create policy visits_tenant_access on public.visits
  for all using (business_id in (select public.my_business_ids()));

drop policy if exists rewards_tenant_access on public.rewards;
create policy rewards_tenant_access on public.rewards
  for all using (business_id in (select public.my_business_ids()));

drop policy if exists locations_tenant_access on public.locations;
create policy locations_tenant_access on public.locations
  for all using (business_id in (select public.my_business_ids()));

-- =============================================================================
--  10. SEED — negocio de demostración (útil en desarrollo)
-- =============================================================================
insert into public.businesses (name, slug, visits_required, reward_label)
select 'Negocio Demo', 'demo', 10, 'Bebida gratis'
where not exists (select 1 from public.businesses where slug = 'demo');

insert into public.locations (business_id, name, address)
select b.id, 'Sucursal Principal', 'Dirección de tu negocio'
from public.businesses b
where b.slug = 'demo'
  and not exists (
    select 1 from public.locations l where l.business_id = b.id
  );

-- =============================================================================
--  11. VALIDACIÓN DE SLUG
--  El slug se usa en la URL pública: empresa.com/<slug>. Debe ser solo
--  minúsculas/números/guiones y no puede chocar con rutas propias de la app.
-- =============================================================================
alter table public.businesses drop constraint if exists businesses_slug_format;
alter table public.businesses add constraint businesses_slug_format
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.businesses drop constraint if exists businesses_slug_not_reserved;
alter table public.businesses add constraint businesses_slug_not_reserved
  check (slug not in (
    'admin','api','card','login','logout','dashboard','b','app',
    'www','assets','static','public','favicon.ico','robots.txt',
    'sitemap.xml','_next','wallet','signup','signin','register'
  ));
