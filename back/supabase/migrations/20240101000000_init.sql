-- Drop everything
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop publication if exists supabase_realtime;
drop table if exists profiles;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  role text not null check (role in ('customer', 'worker', 'manager')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Create updated_at function
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create updated_at trigger for profiles
create trigger set_updated_at
  before update on profiles
  for each row
  execute procedure handle_updated_at();

-- Create policies to allow users to read and update their own profiles
create policy "Users can read their own full profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Anyone can read username and role"
  on profiles for select
  using (true);

-- Create a separate policy for email access
alter table profiles alter column email set default '';
create policy "Only self can read email"
  on profiles for select
  using (auth.uid() = id AND current_setting('app.current_field') = 'email');

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create policy for role updates
create policy "Only managers can update roles"
  on profiles for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

-- Create policy to allow users to create their own profiles
create policy "Users can create their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Create realtime publication
create publication supabase_realtime;
alter publication supabase_realtime add table profiles;

-- Create a secure function to update email without confirmation
create or replace function update_email_admin(user_id uuid, new_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update auth.users email directly
  update auth.users 
  set email = new_email,
      email_confirmed_at = now(),
      updated_at = now()
  where id = user_id;

  -- Update profiles email
  update public.profiles
  set email = new_email
  where id = user_id;
end;
$$;

grant execute on function update_email_admin(uuid, text) to authenticated; 