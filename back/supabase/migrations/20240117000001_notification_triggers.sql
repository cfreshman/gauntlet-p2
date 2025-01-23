-- Create notification functions
create or replace function handle_ticket_comment()
returns trigger as $$
declare
  ticket_record record;
begin
  -- Get ticket details
  select created_by, assigned_to, title into ticket_record
  from tickets where id = NEW.ticket_id;
  
  -- Don't notify for internal comments
  if NEW.internal then
    return NEW;
  end if;

  -- Notify ticket creator if comment is by someone else
  if ticket_record.created_by != NEW.created_by then
    insert into notifications (user_id, type, title, link)
    values (
      ticket_record.created_by,
      'comment_added',
      'new comment on your ticket "' || ticket_record.title || '"',
      '/tickets/' || NEW.ticket_id
    );
  end if;

  -- Notify assigned worker if comment is by someone else
  if ticket_record.assigned_to is not null and ticket_record.assigned_to != NEW.created_by then
    insert into notifications (user_id, type, title, link)
    values (
      ticket_record.assigned_to,
      'comment_added',
      'new comment on ticket "' || ticket_record.title || '"',
      '/tickets/' || NEW.ticket_id
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create or replace function handle_ticket_status()
returns trigger as $$
begin
  -- Only notify if status has changed
  if (TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status) then
    -- Notify ticket creator
    insert into notifications (user_id, type, title, link)
    values (
      NEW.created_by,
      'status_changed',
      'ticket "' || NEW.title || '" status changed to ' || NEW.status,
      '/tickets/' || NEW.id
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_ticket_comment
  after insert on ticket_comments
  for each row
  execute function handle_ticket_comment();

create trigger on_ticket_status
  after update on tickets
  for each row
  execute function handle_ticket_status();