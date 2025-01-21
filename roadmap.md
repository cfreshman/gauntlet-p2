# Auto-CRM Roadmap

## Currently Implemented ✅

### Auth & Users
- Full authentication flow (signup, signin, password reset)
- Role system (customer, worker, manager)
- Profile management
- Team creation and management
- Invite system with magic links
- Worker view of team members

### Tickets
- Basic CRUD operations
- Status and priority management
- Assignment system
  - Managers can assign to workers or themselves
  - Workers can assign to themselves or their manager
  - Workers can assign unassigned tickets
- Comment system with real-time updates
- Permission-based access control
- Username display in comments
- All roles can create tickets

### Security
- Row Level Security (RLS) policies
- Edge Functions for sensitive operations
  - Ticket updates (priority, assignment)
  - Profile updates
  - Team management
- Team-based access control
- Role-based permissions

### Database
- Core tables: profiles, teams, tickets, comments
- Prepared schemas for: custom fields, tags, skills
- Team invite system
- Real-time enabled tables

### UI
- Modern, clean interface
- Responsive layouts
- Real-time updates
- Core pages: auth, tickets, settings
- Team management interface

## Needs Implementation ❌

### Phase 1: Core Enhancements
✅ Security audit completed:
- Email visibility: Properly restricted
- Ticket permissions: Properly implemented
- Team management permissions: Properly implemented  
- Profile update permissions: Properly implemented

### Phase 2: Ticket Features
- Custom fields implementation
  - UI for field management (managers add fields to existing tickets)
  - Template system for reusing field configurations
  - Form-like experience when creating from templates
  - Field types (text, number, select)
  - Validation system
- Tag system
  - Tag management UI
  - Tag filtering
- Internal notes
  - Worker/manager-only comments
  - Visual distinction

### Phase 3: Team Features
- Skills system
  - Skill definition
  - Worker skill tracking
  - Skill-based routing
- Team visibility
  - Availability tracking
  - Workload management

### Phase 4: Customer Features
- Feedback system
  - Post-resolution surveys
  - Rating implementation
- Email integration
  - Notifications
  - Email-to-ticket
- Rich text editing
  - Comment formatting
  - File attachments

### Phase 5: Organization
- Advanced views
  - Custom filters
  - Saved searches
  - Sort by any field
- Basic reporting
  - Ticket metrics
  - Team performance
  - Custom field analytics

## Non-Essential Features
- Caching & optimization
- Multi-channel support
- AI/chatbot features
- Knowledge base
- Self-service portal 