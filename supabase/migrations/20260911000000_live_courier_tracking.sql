alter table public.orders add column if not exists courier_lat double precision;
alter table public.orders add column if not exists courier_lng double precision;
alter table public.orders add column if not exists courier_updated_at timestamptz;
alter table public.orders add column if not exists courier_tracking boolean not null default false;

create or replace function public.update_courier_location(p_order_id uuid,p_lat double precision,p_lng double precision)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if p_lat is null or p_lng is null or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then raise exception 'Koordinat kurir tidak valid'; end if;
 update public.orders set courier_lat=p_lat,courier_lng=p_lng,courier_updated_at=now(),courier_tracking=true,status=case when status='pending' then 'processing' else status end where id=p_order_id and delivery_method='delivery' and status not in ('completed','cancelled');
 return found;
end; $$;
grant execute on function public.update_courier_location(uuid,double precision,double precision) to anon,authenticated;

create or replace function public.set_courier_tracking(p_order_id uuid,p_enabled boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.orders set courier_tracking=p_enabled,courier_updated_at=case when p_enabled then now() else courier_updated_at end,status=case when p_enabled and status='pending' then 'processing' else status end where id=p_order_id and delivery_method='delivery' and status not in ('completed','cancelled');
 return found;
end; $$;
grant execute on function public.set_courier_tracking(uuid,boolean) to anon,authenticated;

create or replace function public.get_order_status(p_order_id uuid)
returns jsonb language sql stable security definer set search_path=public as $$
select jsonb_build_object('id',o.id,'status',o.status,'delivery_method',o.delivery_method,'customer_lat',o.customer_lat,'customer_lng',o.customer_lng,'delivery_distance_km',o.delivery_distance_km,'delivery_fee',o.delivery_fee,'total',o.total,'created_at',o.created_at,'courier_lat',o.courier_lat,'courier_lng',o.courier_lng,'courier_updated_at',o.courier_updated_at,'courier_tracking',o.courier_tracking) from public.orders o where o.id=p_order_id;
$$;
grant execute on function public.get_order_status(uuid) to anon,authenticated;
