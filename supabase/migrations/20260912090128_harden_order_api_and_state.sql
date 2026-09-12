-- Harden public order creation and customer confirmation.

drop policy if exists "public can create orders" on public.orders;
drop policy if exists "public can create order items" on public.order_items;

drop function if exists public.create_order_with_items(text,text,text,text,text,jsonb);
drop function if exists public.create_order_with_items(text,text,text,text,text,jsonb,double precision,double precision);
drop function if exists public.create_order_with_items(text,text,text,text,text,jsonb,text,double precision,double precision);
drop function if exists public.create_order_with_items_v2(text,text,text,text,text,jsonb,text,double precision,double precision);

revoke execute on function public.confirm_delivery_received(uuid) from public, anon, authenticated;

create or replace function public.confirm_delivery_received_by_code(p_order_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_order_code),'') is null then return false; end if;
  update public.orders
  set status='completed', delivery_confirmed_at=now(), courier_tracking=false, updated_at=now()
  where upper(trim(order_code))=upper(trim(p_order_code))
    and delivery_method='delivery' and status='delivering'
    and delivery_arrival_requested_at is not null and delivery_confirmed_at is null;
  return found;
end;
$$;
revoke all on function public.confirm_delivery_received_by_code(text) from public;
grant execute on function public.confirm_delivery_received_by_code(text) to anon, authenticated;

-- The canonical create RPC is redefined in the following migration so the full function body
-- stays readable and versioned separately from this security cleanup.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status = any (array['pending'::text,'processing'::text,'delivering'::text,'completed'::text,'cancelled'::text]));

create or replace function public.generate_order_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare code text; exists_code boolean;
begin
  loop
    code := 'RMK-' || upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,8));
    select exists(select 1 from public.orders where order_code=code) into exists_code;
    exit when not exists_code;
  end loop;
  return code;
end;
$$;

revoke all on function public.get_order_status_by_code(text) from public;
grant execute on function public.get_order_status_by_code(text) to anon, authenticated;
