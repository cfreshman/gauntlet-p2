-- Create auth user handler function
create or replace function handle_auth_user()
returns trigger as $$
begin
  new.created_by = auth.uid();
  return new;
end;
$$ language plpgsql security definer; 