# Notifications System Plan

## Database Schema

```sql
-- Store notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  type text not null,  -- 'ticket_assigned', 'ticket_updated', 'comment_added', etc.
  title text not null,
  link text,          -- URL to relevant resource
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS policies
alter table notifications enable row level security;

-- Users can only view their own notifications
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- System can create notifications
create policy "System can create notifications"
  on notifications for insert
  with check (true);

-- Users can mark notifications as read
create policy "Users can mark as read"
  on notifications for update
  using (auth.uid() = user_id);
```

## Core Notification Types
- Ticket assigned to you
- New comment on your ticket
- Status changed on your ticket
- Added/removed from team

## UI Components

### Notification Bell
- Small icon in header
- Shows unread count
- Clicking opens dropdown

### Notification Dropdown
- List of recent notifications (last 20)
- Mark as read on click
- Clear all button
- Each item shows:
  - Basic message
  - Relative time
  - Link to relevant page

## Implementation

```typescript
interface Notification {
  id: string
  type: 'ticket_assigned' | 'comment_added' | 'ticket_updated' | 'team_updated'
  title: string
  link: string
  read: boolean
  created_at: string
}

// Example edge function
async function handleTicketAssigned(ticket: Ticket) {
  if (ticket.assigned_to) {
    await createNotification({
      user_id: ticket.assigned_to,
      type: 'ticket_assigned',
      title: `Ticket "${ticket.title}" assigned to you`,
      link: `/tickets/${ticket.id}`
    })
  }
}

// Real-time updates
function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  useEffect(() => {
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, 
      payload => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])
}
```

## Testing Plan

### Unit Tests
- Notification creation
- RLS policy validation
- Type validations
- Edge function hooks

### Integration Tests
- Real-time updates
- Email delivery
- Notification preferences
- Batch operations

### User Acceptance
- Notification clarity
- Navigation flow
- Performance metrics
- Mobile responsiveness

## Migration Strategy

1. Create tables without breaking changes
2. Deploy edge functions
3. Add UI components
4. Enable features progressively
5. Backfill recent activities

## Performance Considerations

- Limit notification history
- Batch database operations
- Index frequently queried fields
- Cache notification counts
- Optimize real-time channels
- Clean up old notifications 