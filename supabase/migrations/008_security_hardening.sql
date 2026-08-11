-- Migration 008: hardening de seguridad
-- Aplicada: 2026-08-11
-- Fija search_path en funciones SECURITY DEFINER y restringe su ejecución
-- solo a usuarios autenticados (antes eran ejecutables por el rol anónimo).

alter function public.set_updated_at() set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.revert_wallet_balance(uuid, uuid, numeric, numeric, text) set search_path = public;
alter function public.transfer_wallet_balance(uuid, uuid, numeric, numeric) set search_path = public;
alter function public.update_wallet_balance(uuid, numeric) set search_path = public;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.revert_wallet_balance(uuid, uuid, numeric, numeric, text) from public;
revoke execute on function public.transfer_wallet_balance(uuid, uuid, numeric, numeric) from public;
revoke execute on function public.update_wallet_balance(uuid, numeric) from public;

grant execute on function public.revert_wallet_balance(uuid, uuid, numeric, numeric, text) to authenticated;
grant execute on function public.transfer_wallet_balance(uuid, uuid, numeric, numeric) to authenticated;
grant execute on function public.update_wallet_balance(uuid, numeric) to authenticated;
