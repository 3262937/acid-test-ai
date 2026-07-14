
revoke execute on function public.match_kb_documents(vector, int) from public, anon, authenticated;
grant execute on function public.match_kb_documents(vector, int) to service_role;
