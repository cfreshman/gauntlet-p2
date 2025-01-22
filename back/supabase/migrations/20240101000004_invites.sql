-- Create invites table
create table team_invites (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams(id) on delete cascade not null,
  role text not null check (role in ('worker', 'manager')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  invited_by uuid references auth.users not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  accepted_at timestamptz
);

-- Enable RLS
alter table team_invites enable row level security;

-- Create policies
create policy "Managers can create invites for their team"
  on team_invites for insert
  with check (
    exists (
      select 1 from team_members
      where user_id = auth.uid()
      and team_id = team_invites.team_id
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

create policy "Managers can view their team's invites"
  on team_invites for select
  using (
    exists (
      select 1 from team_members
      where user_id = auth.uid()
      and team_id = team_invites.team_id
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

create policy "Anyone can view pending invites by ID"
  on team_invites for select
  using (status = 'pending');

-- Add to realtime publication
alter publication supabase_realtime add table team_invites; 