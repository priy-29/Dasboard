-- Reduce the public attack surface for legacy/unused order RPCs.
-- Status-by-code remains the intentional public tracking/confirmation API.
revoke execute on function public.courier_complete_delivery(uuid) from public, anon, authenticated;
revoke execute on function public.get_order_status(uuid) from public, anon, authenticated;
revoke execute on function public.get_order_status_v2(uuid) from public, anon, authenticated;
