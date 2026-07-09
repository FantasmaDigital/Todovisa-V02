-- Create a table for public profiles to store user details and roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  first_name text,
  last_name text,
  role text default 'user' check (role in ('user', 'admin', 'moderator', 'agent', 'agency')),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Drop old constraint if exists and apply updated check constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin', 'moderator', 'agent', 'agency'));

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies for public.profiles
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create a trigger function to handle new user signups automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', substring(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '') from '^[^\s]+\s+(.*)$')),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute handle_new_user on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing users into public.profiles
insert into public.profiles (id, email, first_name, last_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'first_name', split_part(coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''), ' ', 1)),
  coalesce(raw_user_meta_data->>'last_name', substring(coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '') from '^[^\s]+\s+(.*)$')),
  coalesce(raw_user_meta_data->>'role', 'user')
from auth.users
on conflict (id) do update set
  email = excluded.email,
  first_name = coalesce(profiles.first_name, excluded.first_name),
  last_name = coalesce(profiles.last_name, excluded.last_name),
  role = coalesce(profiles.role, excluded.role);
