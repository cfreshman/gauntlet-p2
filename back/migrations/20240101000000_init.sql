-- Drop everything
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop function if exists sign_in_with_username(text, text);
drop publication if exists supabase_realtime;
drop table if exists profiles;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users(id) not null primary key,
  username text unique not null,
  email text unique not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint username_length check (char_length(username) >= 3)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create a trigger function to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to call the function after a new user is inserted
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create policies to allow users to read and update their own profiles
create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create a secure sign in function that keeps emails private
create or replace function sign_in_with_username(username text, password text)
returns json
language plpgsql
security definer
set search_path = public
volatile
as $$
declare
  email text;
  result json;
begin
  -- Get email for username (case insensitive)
  select p.email into email
  from profiles p
  where lower(p.username) = lower(sign_in_with_username.username);

  if email is null then
    return json_build_object(
      'error', json_build_object(
        'message', 'invalid credentials',
        'status', 401
      )
    );
  end if;

  -- Attempt sign in and return raw result
  return auth.sign_in_with_password(email, password);
end;
$$;

comment on function sign_in_with_username(text, text) is '@proc_name sign_in_with_username
Allows users to sign in with username instead of email';

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

-- Grant RPC permissions
grant execute on function sign_in_with_username(text, text) to anon;
grant execute on function update_email_admin(uuid, text) to authenticated; 