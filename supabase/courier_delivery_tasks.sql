-- ============================================================
-- COURIER DELIVERY TASKS - VERSI TERBARU
-- Jalankan SEKALI di Supabase SQL Editor.
-- Aman dijalankan ulang (menggunakan IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- 1. Kolom GPS kurir pada orders
alter table public.orders add column if not exists courier_lat double precision;
alter table public.orders add column if not exists courier_lng double precision;
alter table public.orders add column if not exists courier_updated_at timestamptz;
alter table public.orders add column if not exists courier_tracking boolean not null default false;

-- 2. Saat admin mengubah status menjadi delivering,
--    order otomatis dianggap sebagai tugas pengantaran baru.
--    GPS lama dibersihkan agar kurir wajib mengirim posisi terbaru.
create or replace function public.prepare_delivery_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.delivery_method = 'delivery' and new.status = 'delivering'
     and (old.status is distinct from 'delivering') then
    new.courier_lat := null;
    new.courier_lng := null;
    new.courier_updated_at := null;
    new.courier_tracking := false;
  end if;

  if new.status in ('completed','cancelled') then
    new.courier_tracking := false;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prepare_delivery_task on public.orders;
create trigger trg_prepare_delivery_task
before update of status, delivery_method on public.orders
for each row execute function public.prepare_delivery_task();

-- 3. Daftar pesanan yang sedang menjadi tugas kurir.
--    Hanya order delivery dengan status delivering.
create or replace function public.get_courier_tasks()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at asc), '[]'::jsonb)
  into result
  from (
    select
      id,
      customer_name,
      customer_phone,
      customer_address,
      notes,
      payment_method,
      status,
      subtotal,
      delivery_fee,
      total,
      created_at,
      delivery_method,
      customer_lat,
      customer_lng,
      delivery_distance_km,
      courier_lat,
      courier_lng,
      courier_updated_at,
      courier_tracking
    from public.orders
    where delivery_method = 'delivery'
      and status = 'delivering'
    order by created_at asc
  ) x;

  return result;
end;
$$;

grant execute on function public.get_courier_tasks() to anon, authenticated;

-- 4. Update GPS kurir yang aman: hanya untuk tugas delivering,
--    dan tidak menerima koordinat di luar bumi.
create or replace function public.update_courier_location(
  p_order_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_lat is null or p_lng is null
     or p_lat < -90 or p_lat > 90
     or p_lng < -180 or p_lng > 180 then
    raise exception 'Koordinat kurir tidak valid';
  end if;

  update public.orders
  set courier_lat = p_lat,
      courier_lng = p_lng,
      courier_updated_at = now(),
      courier_tracking = true
  where id = p_order_id
    and delivery_method = 'delivery'
    and status = 'delivering';

  return found;
end;
$$;

grant execute on function public.update_courier_location(uuid,double precision,double precision) to anon, authenticated;

-- 5. Nyalakan/matikan status LIVE tanpa mengubah status pesanan.
create or replace function public.set_courier_tracking(
  p_order_id uuid,
  p_enabled boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set courier_tracking = p_enabled,
      courier_updated_at = case when p_enabled then now() else courier_updated_at end
  where id = p_order_id
    and delivery_method = 'delivery'
    and status = 'delivering';

  return found;
end;
$$;

grant execute on function public.set_courier_tracking(uuid,boolean) to anon, authenticated;

-- 6. Refresh schema cache Supabase
notify pgrst, 'reload schema';

-- Setelah berhasil, hasil yang normal di SQL Editor:
-- Success. No rows returned
