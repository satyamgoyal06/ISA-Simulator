-- Function to automatically create a user profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, name, tests_completed, practice_sessions)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    0,
    0
  );
  return new;
end;
$$;

-- Trigger the function every time a user is inserted into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
