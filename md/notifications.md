# Notifications System

## Database
- `notifications` table with RLS
- Fields: user_id, type, title, link, read status
- Policies:
  - Users can view own notifications
  - System can create notifications
  - Users can mark as read

## Types
- Comment notifications:
  - AI comments notify creator and worker
  - Human comments notify other participants
- Status changes notify creator
- Assignments notify new assignee

## UI Components
- Bell icon with unread count
- Dropdown menu with notifications
- Mark as read functionality
- Real-time updates via Supabase channels

## Integration
- Triggered by database changes
- Links to relevant tickets
- Supports AI system actions
- 30-day retention
