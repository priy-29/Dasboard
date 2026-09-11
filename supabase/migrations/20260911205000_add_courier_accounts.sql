create table if not exists public.couriers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.couriers enable row level security;
revoke all on public.couriers from anon, authenticated;
grant select on public.couriers to authenticated;

drop policy if exists "admins_manage_couriers" on public.couriers;
create policy "admins_manage_couriers" on public.couriers
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

alter table public.orders add column if not exists courier_id uuid references public.couriers(id) on delete set null;
create index if not exists orders_courier_id_idx on public.orders(courier_id);

create or replace function public.courier_is_active()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.couriers c where c.id=(select auth.uid()) and c.is_active=true);
$$;
revoke all on function public.courier_is_active() from public;
grant execute on function public.courier_is_active() to authenticated;

create or replace function public.get_courier_tasks()
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if not public.courier_is_active() and not public.is_admin() then raise exception 'Akun tidak memiliki akses kurir'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at asc),'[]'::jsonb) into result
  from (
    select o.id,o.customer_name,o.customer_phone,o.customer_address,o.notes,o.payment_method,o.status,o.subtotal,o.delivery_fee,o.total,o.created_at,o.delivery_method,o.customer_lat,o.customer_lng,o.delivery_distance_km,o.courier_lat,o.courier_lng,o.courier_updated_at,o.courier_tracking,o.delivery_arrival_requested_at,o.delivery_confirmed_at,o.courier_id
    from public.orders o
    where o.delivery_method='delivery' and o.status in ('processing','delivering')
      and (o.status='processing' or o.courier_id=(select auth.uid()) or public.is_admin())
  ) x;
  return result;
end; $$;

create or replace function public.claim_delivery_task(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() and not public.is_admin() then raise exception 'Akun tidak memiliki akses kurir'; end if;
  update public.orders set status='delivering', courier_id=case when public.is_admin() then courier_id else (select auth.uid()) end
  where id=p_order_id and delivery_method='delivery' and status='processing';
  return found;
end; $$;

create or replace function public.update_courier_location(p_order_id uuid,p_lat double precision,p_lng double precision)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() and not public.is_admin() then raise exception 'Akun tidak memiliki akses kurir'; end if;
  if p_lat is null or p_lng is null or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then raise exception 'Koordinat kurir tidak valid'; end if;
  update public.orders set courier_lat=p_lat,courier_lng=p_lng,courier_updated_at=now(),courier_tracking=true
  where id=p_order_id and delivery_method='delivery' and status='delivering' and (courier_id=(select auth.uid()) or public.is_admin());
  return found;
end; $$;

create or replace function public.set_courier_tracking(p_order_id uuid,p_enabled boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() and not public.is_admin() then raise exception 'Akun tidak memiliki akses kurir'; end if;
  update public.orders set courier_tracking=p_enabled,courier_updated_at=case when p_enabled then now() else courier_updated_at end
  where id=p_order_id and delivery_method='delivery' and status='delivering' and (courier_id=(select auth.uid()) or public.is_admin());
  return found;
end; $$;

create or replace function public.request_delivery_confirmation(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() and not public.is_admin() then raise exception 'Akun tidak memiliki akses kurir'; end if;
  update public.orders set delivery_arrival_requested_at=coalesce(delivery_arrival_requested_at,now()),courier_tracking=false
  where id=p_order_id and delivery_method='delivery' and status='delivering' and (courier_id=(select auth.uid()) or public.is_admin());
  return found;
end; $$;

grant execute on function public.get_courier_tasks() to authenticated;
grant execute on function public.claim_delivery_task(uuid) to authenticated;
grant execute on function public.update_courier_location(uuid,double precision,double precision) to authenticated;
grant execute on function public.set_courier_tracking(uuid,boolean) to authenticated;
grant execute on function public.request_delivery_confirmation(uuid) to authenticated;

create or replace function public.confirm_delivery_received(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.orders set status='completed',delivery_confirmed_at=now(),courier_tracking=false
  where id=p_order_id and delivery_method='delivery' and status='delivering' and delivery_arrival_requested_at is not null;
  return found;
end; $$;
grant execute on function public.confirm_delivery_received(uuid) to anon,authenticated;
