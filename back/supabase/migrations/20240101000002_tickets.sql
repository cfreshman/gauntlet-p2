-- Create teams table first
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Enable RLS for teams
alter table teams enable row level security;

-- Create team members table
create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (team_id, user_id)
);

-- Enable RLS for team members
alter table team_members enable row level security;

-- Then create tickets that reference teams
create table tickets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'new',
  priority text not null default 'medium',
  restricted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  constraint valid_status check (status in ('new', 'open', 'pending', 'resolved', 'closed')),
  constraint valid_priority check (priority in ('low', 'medium', 'high', 'urgent'))
);

-- Finally create tables that reference tickets
create table ticket_comments (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  content text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table ticket_feedback (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Enable RLS
alter table tickets enable row level security;

-- Create policies
create policy "Customers can view their own tickets"
  on tickets for select
  using (created_by = auth.uid());

create policy "Everyone can view templates"
  on tickets for select
  using (title like 'template: %');

create policy "Workers can view unrestricted tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'worker'
    )
    and not restricted
  );

create policy "Managers can view all tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Assigned workers can update their tickets"
  on tickets for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

create policy "Managers can update any ticket"
  on tickets for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Workers can assign/unassign themselves"
  on tickets for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'worker'
    )
    and (
      -- Allow unassigning if currently assigned to me
      assigned_to = auth.uid()
      or
      -- Allow assigning if currently unassigned
      assigned_to is null
    )
  )
  with check (
    -- Can only set assigned_to to myself or null
    assigned_to is null 
    or 
    assigned_to = auth.uid()
  );

-- Trigger for updated_at
create trigger set_updated_at
  before update on tickets
  for each row
  execute procedure handle_updated_at();

-- After existing tickets table...

-- Enable RLS
alter table ticket_comments enable row level security;

-- Comment policies
create policy "Customers can view non-internal comments on their tickets"
  on ticket_comments for select
  using (
    not internal and
    exists (
      select 1 from tickets
      where id = ticket_id
      and created_by = auth.uid()
    )
  );

create policy "Workers can view all comments on their assigned tickets"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets
      where id = ticket_id
      and assigned_to = auth.uid()
    )
  );

create policy "Workers can view comments on viewable tickets"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets t
      join profiles p on p.id = auth.uid()
      where t.id = ticket_id
      and p.role = 'worker'
      and not t.restricted
    )
  );

create policy "Managers can view all comments"
  on ticket_comments for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Customers can comment on their tickets"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from tickets
      where id = ticket_id
      and created_by = auth.uid()
    )
  );

create policy "Workers can comment on their assigned tickets"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from tickets
      where id = ticket_id
      and assigned_to = auth.uid()
    )
  );

create policy "Managers can comment on any ticket"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create table ticket_tags (
  id uuid default gen_random_uuid() primary key,
  name text unique not null
);

create table ticket_tag_links (
  ticket_id uuid references tickets(id) on delete cascade,
  tag_id uuid references ticket_tags(id) on delete cascade,
  primary key (ticket_id, tag_id)
);

-- Enable RLS
alter table ticket_tags enable row level security;
alter table ticket_tag_links enable row level security;

-- Tag policies
create policy "Everyone can view tags"
  on ticket_tags for select
  using (true);

create policy "Managers can manage tags"
  on ticket_tags for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Tag link policies follow ticket visibility
create policy "Can view tags on viewable tickets"
  on ticket_tag_links for select
  using (
    exists (
      select 1 from tickets
      where id = ticket_id
      and (
        created_by = auth.uid()
        or (
          exists (
            select 1 from profiles p
            where p.id = auth.uid()
            and p.role in ('worker', 'manager')
            and (not restricted or p.role = 'manager')
          )
        )
      )
    )
  );

-- Custom fields schema
create table ticket_field_definitions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('text', 'number', 'boolean', 'date')),
  required boolean not null default false,
  created_at timestamptz not null default now(),
  owner_id uuid references auth.users(id) on delete set null
);

-- Create team field definitions link table
create table team_field_definitions (
  team_id uuid references teams(id) on delete cascade,
  field_id uuid references ticket_field_definitions(id) on delete cascade,
  primary key (team_id, field_id)
);

create table ticket_field_values (
  ticket_id uuid references tickets(id) on delete cascade,
  field_id uuid references ticket_field_definitions(id) on delete cascade,
  value text,
  created_at timestamptz not null default now(),
  primary key (ticket_id, field_id)
);

-- Enable RLS
alter table ticket_field_definitions enable row level security;
alter table team_field_definitions enable row level security;
alter table ticket_field_values enable row level security;

-- Field definition policies
create policy "Everyone can view field definitions"
  on ticket_field_definitions for select
  using (true);

create policy "Managers can create field definitions"
  on ticket_field_definitions for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Managers can update their field definitions"
  on ticket_field_definitions for update
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Managers can transfer field definition ownership"
  on ticket_field_definitions for update
  using (owner_id = auth.uid())
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
    and exists (
      select 1 from profiles
      where id = owner_id
      and role = 'manager'
    )
  );

-- Team field definition policies
create policy "Team members can view their team's field definitions"
  on team_field_definitions for select
  using (
    exists (
      select 1 from team_members
      where team_id = team_field_definitions.team_id
      and user_id = auth.uid()
    )
  );

create policy "Managers can manage their team's field definitions"
  on team_field_definitions for all
  using (
    exists (
      select 1 from team_members
      where team_id = team_field_definitions.team_id
      and user_id = auth.uid()
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

-- Field value policies
create policy "Can view field values on viewable tickets"
  on ticket_field_values for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid()
        or exists (
          select 1 from profiles p
          where p.id = auth.uid()
          and p.role in ('worker', 'manager')
          and (not t.restricted or p.role = 'manager')
        )
      )
    )
  );

create policy "Can view field values on templates"
  on ticket_field_values for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.title like 'template: %'
    )
  );

create policy "Managers can manage any field values"
  on ticket_field_values for all
  using (
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

create policy "Workers can manage field values on team tickets"
  on ticket_field_values for all
  using (
    exists (
      select 1 from tickets t
      join team_field_definitions tfd on tfd.team_id = t.team_id
      where t.id = ticket_id
      and tfd.field_id = field_id
      and exists (
        select 1 from team_members
        where team_id = t.team_id
        and user_id = auth.uid()
        and exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'worker'
        )
      )
    )
  );

-- Skills schema
create table skills (
  id uuid default gen_random_uuid() primary key,
  name text unique not null
);

create table user_skills (
  user_id uuid references auth.users(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (user_id, skill_id)
);

create table ticket_required_skills (
  ticket_id uuid references tickets(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (ticket_id, skill_id)
);

-- Enable RLS
alter table skills enable row level security;
alter table user_skills enable row level security;
alter table ticket_required_skills enable row level security;

-- Skill policies
create policy "Everyone can view skills"
  on skills for select using (true);

-- Knowledge base schema
create table kb_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table kb_article_tags (
  article_id uuid references kb_articles(id) on delete cascade,
  tag_id uuid references ticket_tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- Enable RLS
alter table kb_articles enable row level security;
alter table kb_article_tags enable row level security;

-- Article policies
create policy "Everyone can view published articles"
  on kb_articles for select
  using (published);

create policy "Workers can view all articles"
  on kb_articles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  );

create policy "Managers can manage articles"
  on kb_articles for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Article tag policies
create policy "Everyone can view article tags"
  on kb_article_tags for select
  using (true);

create policy "Managers can manage article tags"
  on kb_article_tags for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Add policy for team-based viewing
create policy "Team members can view their team's tickets"
  on tickets for select
  using (
    exists (
      select 1 from team_members
      where team_id = tickets.team_id
      and user_id = auth.uid()
    )
  );

-- Add policy for team-based updates
create policy "Team members can update their team's tickets"
  on tickets for update
  using (
    exists (
      select 1 from team_members
      where team_id = tickets.team_id
      and user_id = auth.uid()
    )
  );

-- Simple ticket creation policy
create policy "Anyone can create tickets"
  on tickets for insert
  with check (created_by = auth.uid());

-- Add update policies for tag links
create policy "Can update tags on updatable tickets"
  on ticket_tag_links for update
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add insert policies for tag links
create policy "Can insert tags on updatable tickets"
  on ticket_tag_links for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add insert/update policies for user skills
create policy "Workers can manage their own skills"
  on user_skills for all
  using (
    user_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  );

-- Add policies for ticket required skills
create policy "Can view required skills on viewable tickets"
  on ticket_required_skills for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid()
        or (
          exists (
            select 1 from profiles p
            where p.id = auth.uid()
            and p.role in ('worker', 'manager')
            and (not t.restricted or p.role = 'manager')
          )
        )
      )
    )
  );

create policy "Can manage required skills on updatable tickets"
  on ticket_required_skills for all
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add policies for team member management
create policy "Managers can manage team members"
  on team_members for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

-- Add delete policies for tickets
create policy "Managers can delete tickets"
  on tickets for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

-- Add delete policies for comments
create policy "Managers can delete comments"
  on ticket_comments for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Customers can delete their own comments"
  on ticket_comments for delete
  using (
    created_by = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'customer'
    )
  );

-- Add tables to realtime publication
alter publication supabase_realtime 
  add table tickets, 
  ticket_comments, 
  ticket_tags,
  ticket_tag_links,
  ticket_field_values,
  teams,
  team_members,
  skills,
  user_skills,
  ticket_required_skills,
  kb_articles,
  kb_article_tags,
  ticket_feedback;

-- Add missing RLS enablement
alter table ticket_feedback enable row level security;

-- Add missing feedback policies
create policy "Customers can view feedback on their tickets"
  on ticket_feedback for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

create policy "Workers can view feedback on assigned tickets"
  on ticket_feedback for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.assigned_to = auth.uid()
    )
  );

create policy "Managers can view all feedback"
  on ticket_feedback for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

create policy "Customers can add feedback to their tickets"
  on ticket_feedback for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

-- Keep this correct version at the bottom
create policy "Managers can manage skills"
  on skills for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Add missing view policy for user skills
create policy "Anyone can view user skills"
  on user_skills for select
  using (true);

-- Add missing team policies
create policy "Team members can view their teams"
  on teams for select
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = id
      and tm.user_id = auth.uid()
    )
  );

create policy "Workers can view teams they're assigned to"
  on teams for select
  using (
    exists (
      select 1 from tickets t
      where t.team_id = id
      and t.assigned_to = auth.uid()
    )
  );

-- Add missing team member policies
create policy "Everyone can view team members"
  on team_members for select
  using (true);

create policy "Managers can manage their team members"
  on team_members for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Team policies
create policy "Everyone can view teams"
  on teams for select
  using (true);

create policy "Managers can manage their teams"
  on teams for all
  using (
    exists (
      select 1 from team_members
      where user_id = auth.uid()
      and team_id = teams.id
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

create policy "Managers can delete their field definitions"
  on ticket_field_definitions for delete
  using (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Can insert field values on new tickets"
  on ticket_field_values for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

-- Add delete policies for tag links
create policy "Can delete tags on updatable tickets"
  on ticket_tag_links for delete
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

