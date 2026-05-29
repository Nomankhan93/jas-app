do $$
begin
  alter type public.app_role add value if not exists 'finance_admin';
exception
  when duplicate_object then null;
end $$;
