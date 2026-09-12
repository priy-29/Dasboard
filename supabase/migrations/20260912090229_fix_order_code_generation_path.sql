-- gen_random_bytes lives in the extensions schema on Supabase projects.
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
