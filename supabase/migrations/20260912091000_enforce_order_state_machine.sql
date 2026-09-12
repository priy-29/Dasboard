create or replace function public.enforce_order_state_machine()
returns trigger
language plpgsql
as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if old.status in ('completed','cancelled') then raise exception 'Pesanan yang sudah selesai/dibatalkan tidak dapat diubah'; end if;
  if old.status='pending' and new.status not in ('processing','cancelled') then raise exception 'Transisi status tidak valid: pending -> %',new.status; end if;
  if old.status='processing' and new.status not in ('delivering','completed','cancelled') then raise exception 'Transisi status tidak valid: processing -> %',new.status; end if;
  if old.status='delivering' and new.status not in ('completed','cancelled') then raise exception 'Transisi status tidak valid: delivering -> %',new.status; end if;
  if new.status='completed' and new.delivery_method='delivery' and new.delivery_confirmed_at is null then raise exception 'Pesanan delivery wajib dikonfirmasi pembeli sebelum selesai'; end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_order_state_machine on public.orders;
create trigger trg_enforce_order_state_machine
before update of status on public.orders
for each row execute function public.enforce_order_state_machine();
