-- ============================================================
-- COURIER DELIVERY TASKS - VERSI TERBARU
-- ============================================================

alter table public.orders add column if not exists courier_lat double precision;
alter table public.orders add column if not exists courier_lng double precision;
alter table public.orders add column if not exists courier_updated_at timestamptz;
alter table public.orders add column if not exists courier_tracking boolean not null default false;
alter table public.orders add column if not exists delivery_arrival_requested_at timestamptz;
alter table public.orders add column if not exists delivery_confirmed_at timestamptz;

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
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at asc),'[]'::jsonb) into result
  from (select id,customer_name,customer_phone,customer_address,notes,payment_method,status,subtotal,delivery_fee,total,created_at,delivery_method,customer_lat,customer_lng,delivery_distance_km,courier_lat,courier_lng,courier_updated_at,courier_tracking,delivery_arrival_requested_at,delivery_confirmed_at from public.orders where delivery_method='delivery' and status='delivering' order by created_at asc) x;
  return result;
end; $$;
grant execute on function public.get_courier_tasks() to anon,authenticated;

create or replace function public.update_courier_location(p_order_id uuid,p_lat double precision,p_lng double precision)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if p_lat is null or p_lng is null or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then raise exception 'Koordinat kurir tidak valid'; end if;
  update public.orders set courier_lat=p_lat,courier_lng=p_lng,courier_updated_at=now(),courier_tracking=true where id=p_order_id and delivery_method='delivery' and status='delivering' and delivery_arrival_requested_at is null;
  return found;
end; $$;
grant execute on function public.update_courier_location(uuid,double precision,double precision) to anon,authenticated;

create or replace function public.set_courier_tracking(p_order_id uuid,p_enabled boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.orders set courier_tracking=p_enabled,courier_updated_at=case when p_enabled then now() else courier_updated_at end where id=p_order_id and delivery_method='delivery' and status='delivering' and delivery_arrival_requested_at is null;
  return found;
end; $$;
grant execute on function public.set_courier_tracking(uuid,boolean) to anon,authenticated;

create or replace function public.request_delivery_confirmation(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.orders set delivery_arrival_requested_at=coalesce(delivery_arrival_requested_at,now()),courier_tracking=false where id=p_order_id and delivery_method='delivery' and status='delivering';
  return found;
end; $$;
grant execute on function public.request_delivery_confirmation(uuid) to anon,authenticated;

create or replace function public.confirm_delivery_received(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.orders set status='completed',delivery_confirmed_at=now(),courier_tracking=false where id=p_order_id and delivery_method='delivery' and status='delivering' and delivery_arrival_requested_at is not null;
  return found;
end; $$;
grant execute on function public.confirm_delivery_received(uuid) to anon,authenticated;

create or replace function public.get_order_status(p_order_id uuid)
returns jsonb language sql stable security definer set search_path=public as $$
select jsonb_build_object('id',o.id,'status',o.status,'delivery_method',o.delivery_method,'customer_lat',o.customer_lat,'customer_lng',o.customer_lng,'delivery_distance_km',o.delivery_distance_km,'delivery_fee',o.delivery_fee,'total',o.total,'created_at',o.created_at,'courier_lat',o.courier_lat,'courier_lng',o.courier_lng,'courier_updated_at',o.courier_updated_at,'courier_tracking',o.courier_tracking,'delivery_arrival_requested_at',o.delivery_arrival_requested_at,'delivery_confirmed_at',o.delivery_confirmed_at) from public.orders o where o.id=p_order_id;
$$;
grant execute on function public.get_order_status(uuid) to anon,authenticated;

notify pgrst,'reload schema';