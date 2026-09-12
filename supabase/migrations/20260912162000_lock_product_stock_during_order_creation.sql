-- Prevent concurrent checkouts from overselling the same product.
-- The canonical order-creation function locks each product row while validating stock.
create or replace function public.create_order_with_items(
  p_customer_name text, p_customer_phone text, p_customer_address text, p_notes text,
  p_payment_method text, p_items jsonb, p_delivery_method text default 'delivery',
  p_customer_lat double precision default null, p_customer_lng double precision default null,
  p_order_type text default null, p_pickup_time text default null,
  p_payment_note text default null, p_payment_status text default 'unpaid'
)
returns uuid language plpgsql security definer set search_path=public,extensions
as $$
declare
  v_order_id uuid; v_subtotal integer:=0; v_delivery_fee integer:=0; v_distance_km double precision:=null;
  v_item jsonb; v_product public.products%rowtype; v_qty integer; v_setting public.delivery_settings%rowtype;
  v_lat double precision; v_lng double precision;
  v_type text:=case when p_order_type='pickup' then 'takeaway' else coalesce(nullif(p_order_type,''),case when p_delivery_method='delivery' then 'delivery' else 'takeaway' end) end;
  v_payment_status text:=case when public.is_admin() then p_payment_status else 'unpaid' end;
begin
  if nullif(trim(p_customer_name),'') is null then raise exception 'Nama wajib diisi'; end if;
  if nullif(trim(p_customer_phone),'') is null then raise exception 'Nomor WhatsApp wajib diisi'; end if;
  if v_type not in ('dine_in','takeaway','delivery') then raise exception 'Tipe pemesanan tidak valid'; end if;
  if p_payment_method not in ('cod','transfer','qris') then raise exception 'Metode pembayaran tidak valid'; end if;
  if v_payment_status not in ('unpaid','paid') then raise exception 'Status pembayaran tidak valid'; end if;
  if v_type='dine_in' and nullif(trim(p_notes),'') is null then raise exception 'Nomor meja wajib diisi'; end if;
  if v_type='takeaway' and p_order_type<>'pickup' and nullif(trim(p_pickup_time),'') is null then raise exception 'Jam pengambilan wajib diisi'; end if;
  if v_type='delivery' then
    if nullif(trim(p_customer_address),'') is null then raise exception 'Alamat pengantaran wajib diisi'; end if;
    if p_customer_lat is null or p_customer_lng is null then raise exception 'Lokasi GPS wajib diaktifkan untuk pengantaran'; end if;
    if p_customer_lat not between -90 and 90 or p_customer_lng not between -180 and 180 then raise exception 'Koordinat lokasi tidak valid'; end if;
  end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Keranjang kosong'; end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    begin v_qty:=(v_item->>'quantity')::integer; exception when invalid_text_representation then raise exception 'Jumlah produk tidak valid'; end;
    if v_qty is null or v_qty<=0 or v_qty>100 then raise exception 'Jumlah produk tidak valid'; end if;
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and is_available=true for update;
    if not found then raise exception 'Produk tidak tersedia'; end if;
    if v_qty>v_product.stock then raise exception 'Stok produk tidak mencukupi: %',v_product.name; end if;
    v_subtotal:=v_subtotal+(v_product.price*v_qty);
  end loop;
  if v_type='delivery' then
    select * into v_setting from public.delivery_settings order by id limit 1;
    if v_setting.restaurant_lat is null or v_setting.restaurant_lng is null then raise exception 'Lokasi rumah makan belum diatur'; end if;
    v_lat:=radians(p_customer_lat-v_setting.restaurant_lat); v_lng:=radians(p_customer_lng-v_setting.restaurant_lng);
    v_distance_km:=6371.0*2*asin(sqrt(sin(v_lat/2)^2+cos(radians(v_setting.restaurant_lat))*cos(radians(p_customer_lat))*sin(v_lng/2)^2));
    if v_subtotal>=v_setting.free_shipping_minimum then v_delivery_fee:=0; else v_delivery_fee:=v_setting.base_fee+ceil(v_distance_km)*v_setting.per_km_fee; end if;
  end if;
  insert into public.orders(customer_name,customer_phone,customer_address,notes,payment_method,delivery_method,order_type,pickup_time,payment_note,payment_status,customer_lat,customer_lng,delivery_distance_km,subtotal,delivery_fee,total,status)
  values(trim(p_customer_name),trim(p_customer_phone),case when v_type='delivery' then trim(p_customer_address) when v_type='dine_in' then 'Makan di tempat' else 'Ambil sendiri' end,nullif(trim(coalesce(p_notes,'')),''),p_payment_method,case when v_type='delivery' then 'delivery' else 'pickup' end,v_type,case when v_type='takeaway' and p_order_type<>'pickup' then nullif(trim(p_pickup_time),'') else null end,nullif(trim(coalesce(p_payment_note,'')),''),v_payment_status,case when v_type='delivery' then p_customer_lat else null end,case when v_type='delivery' then p_customer_lng else null end,case when v_type='delivery' then v_distance_km else null end,v_subtotal,case when v_type='delivery' then v_delivery_fee else 0 end,v_subtotal+case when v_type='delivery' then v_delivery_fee else 0 end,'pending') returning id into v_order_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and is_available=true;
    v_qty:=(v_item->>'quantity')::integer;
    insert into public.order_items(order_id,product_id,product_name,price,quantity,notes,options,special_note) values(v_order_id,v_product.id,v_product.name,v_product.price,v_qty,nullif(trim(coalesce(v_item->>'notes','')),''),coalesce(v_item->'options','{}'::jsonb),nullif(trim(coalesce(v_item->>'special_note','')),''));
    update public.products set stock=stock-v_qty,is_available=case when stock-v_qty<=0 then false else is_available end,updated_at=now() where id=v_product.id;
  end loop;
  return v_order_id;
end; $$;

revoke all on function public.create_order_with_items(text,text,text,text,text,jsonb,text,double precision,double precision,text,text,text,text) from public;
grant execute on function public.create_order_with_items(text,text,text,text,text,jsonb,text,double precision,double precision,text,text,text,text) to anon,authenticated;
