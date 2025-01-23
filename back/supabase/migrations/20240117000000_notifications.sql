-- Create notifications table
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  type text not null,
  title text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table notifications enable row level security;

-- Enable realtime
alter publication supabase_realtime add table notifications;

-- RLS policies
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "System can create notifications"
  on notifications for insert
  with check (true);

create policy "Users can mark as read"
  on notifications for update
  using (auth.uid() = user_id);

-- Function to clean up old notifications
create or replace function cleanup_old_notifications()
returns trigger as $$
begin
  delete from notifications
  where created_at < now() - interval '30 days';
  return null;
end;
$$ language plpgsql security definer;

-- Trigger to run cleanup daily
create trigger cleanup_notifications_trigger
  after insert on notifications
  execute function cleanup_old_notifications(); 