-- ============================================================
-- COURIER DELIVERY TASKS - HARDENED
-- ============================================================

alter table public.orders add column if not exists courier_lat double precision;
alter table public.orders add column if not exists courier_lng double precision;
alter table public.orders add column if not exists courier_updated_at timestamptz;
alter table public.orders add column if not exists courier_tracking boolean not null default false;
alter table public.orders add column if not exists delivery_arrival_requested_at timestamptz;
alter table public.orders add column if not exists delivery_confirmed_at timestamptz;
alter table public.orders add column if not exists courier_id uuid references public.couriers(id) on delete set null;

create or replace function public.courier_is_active()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.couriers c
    where c.id=(select auth.uid()) and c.is_active=true
  );
$$;
revoke all on function public.courier_is_active() from public;
grant execute on function public.courier_is_active() to authenticated;

create or replace function public.prepare_delivery_task()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.delivery_method='delivery' and new.status='delivering' and old.status is distinct from 'delivering' then
    new.courier_lat:=null; new.courier_lng:=null; new.courier_updated_at:=null; new.courier_tracking:=false;
    new.delivery_arrival_requested_at:=null; new.delivery_confirmed_at:=null;
  end if;
  if new.delivery_method='delivery' and new.status='completed' and new.delivery_confirmed_at is null then
    raise exception 'Pesanan delivery wajib dikonfirmasi pembeli sebelum selesai';
  end if;
  if new.status in ('completed','cancelled') then new.courier_tracking:=false; end if;
  return new;
end; $$;

drop trigger if exists trg_prepare_delivery_task on public.orders;
create trigger trg_prepare_delivery_task before update of status,delivery_method on public.orders for each row execute function public.prepare_delivery_task();

create or replace function public.get_courier_tasks()
returns setof public.orders language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() then raise exception 'Akun kurir tidak aktif'; end if;
  return query
    select o.* from public.orders o
    where o.delivery_method='delivery'
      and ((o.status='processing' and o.courier_id is null) or (o.status='delivering' and o.courier_id=(select auth.uid())))
    order by o.created_at asc;
end; $$;
revoke execute on function public.get_courier_tasks() from anon;
grant execute on function public.get_courier_tasks() to authenticated;

create or replace function public.claim_delivery_task(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() then raise exception 'Akun kurir tidak aktif'; end if;
  update public.orders set courier_id=(select auth.uid()),status='delivering'
  where id=p_order_id and delivery_method='delivery' and status='processing' and courier_id is null;
  return found;
end; $$;
revoke execute on function public.claim_delivery_task(uuid) from anon;
grant execute on function public.claim_delivery_task(uuid) to authenticated;

create or replace function public.update_courier_location(p_order_id uuid,p_lat double precision,p_lng double precision)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() then raise exception 'Akun kurir tidak aktif'; end if;
  if p_lat is null or p_lng is null or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then raise exception 'Koordinat kurir tidak valid'; end if;
  update public.orders set courier_lat=p_lat,courier_lng=p_lng,courier_updated_at=now(),courier_tracking=true
  where id=p_order_id and delivery_method='delivery' and status='delivering' and courier_id=(select auth.uid()) and delivery_arrival_requested_at is null;
  return found;
end; $$;
revoke execute on function public.update_courier_location(uuid,double precision,double precision) from anon;
grant execute on function public.update_courier_location(uuid,double precision,double precision) to authenticated;

create or replace function public.set_courier_tracking(p_order_id uuid,p_enabled boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() then raise exception 'Akun kurir tidak aktif'; end if;
  update public.orders set courier_tracking=p_enabled,courier_updated_at=case when p_enabled then now() else courier_updated_at end
  where id=p_order_id and delivery_method='delivery' and status='delivering' and courier_id=(select auth.uid()) and delivery_arrival_requested_at is null;
  return found;
end; $$;
revoke execute on function public.set_courier_tracking(uuid,boolean) from anon;
grant execute on function public.set_courier_tracking(uuid,boolean) to authenticated;

create or replace function public.request_delivery_confirmation(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.courier_is_active() then raise exception 'Akun kurir tidak aktif'; end if;
  update public.orders set delivery_arrival_requested_at=coalesce(delivery_arrival_requested_at,now()),courier_tracking=false
  where id=p_order_id and delivery_method='delivery' and status='delivering' and courier_id=(select auth.uid()) and delivery_arrival_requested_at is null;
  return found;
end; $$;
revoke execute on function public.request_delivery_confirmation(uuid) from anon;
grant execute on function public.request_delivery_confirmation(uuid) to authenticated;

create or replace function public.confirm_delivery_received(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.orders set status='completed',delivery_confirmed_at=now(),courier_tracking=false
  where id=p_order_id and delivery_method='delivery' and status='delivering' and delivery_arrival_requested_at is not null;
  return found;
end; $$;
grant execute on function public.confirm_delivery_received(uuid) to anon,authenticated;

create or replace function public.get_order_status(p_order_id uuid)
returns jsonb language sql stable security definer set search_path=public as $$
select jsonb_build_object('id',o.id,'status',o.status,'delivery_method',o.delivery_method,'customer_lat',o.customer_lat,'customer_lng',o.customer_lng,'delivery_distance_km',o.delivery_distance_km,'delivery_fee',o.delivery_fee,'total',o.total,'created_at',o.created_at,'courier_lat',o.courier_lat,'courier_lng',o.courier_lng,'courier_updated_at',o.courier_updated_at,'courier_tracking',o.courier_tracking,'delivery_arrival_requested_at',o.delivery_arrival_requested_at,'delivery_confirmed_at',o.delivery_confirmed_at) from public.orders o where o.id=p_order_id;
$$;
grant execute on function public.get_order_status(uuid) to anon,authenticated;

notify pgrst,'reload schema';