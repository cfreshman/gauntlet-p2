# auto-crm

Modern customer support system with AI enhancements for efficient ticket management and customer service.

## Overview

auto-crm provides:
- Comprehensive ticket management with role-based access control
- Modern customer support portal with real-time updates
- Team management and intelligent ticket assignment
- Advanced comment system with internal notes
- Template system for quick responses
- Real-time notifications
- Tag-based organization

## Project Structure

```
/
├── back/                    # Backend (Supabase)
│   ├── supabase/           
│   │   ├── functions/      # Edge Functions
│   │   │   ├── _shared/    # Shared utilities
│   │   │   ├── create-ticket/
│   │   │   ├── update-ticket/
│   │   │   └── ...
│   │   └── migrations/     # Database schemas
│   ├── deploy-functions.sh # Deploy edge functions
│   └── reset-and-migrate.sh # Reset and migrate database
│
├── front/                  # Frontend (React)
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── tickets/   # Ticket-related components
│   │   │   ├── teams/     # Team management
│   │   │   └── ui/        # Shared UI components
│   │   ├── lib/          # Hooks and utilities
│   │   │   ├── hooks/    # React hooks
│   │   │   ├── types.ts  # TypeScript types
│   │   │   └── supabase.ts # Supabase client
│   │   └── styles/       # Global styles
│   └── public/           # Static assets
│
└── md/                   # Documentation
    ├── kb.md            # Knowledge base
    ├── map.md          # Project map
    └── notifications.md # Notification system
```

## Getting Started

### 1. Backend Setup

1. Create two Supabase projects (development and production)

2. Set up environment:
```bash
cd back
cp .env.example .env.development
cp .env.example .env.production
```

3. Update environment files with your Supabase project URLs:
```env
# .env.development or .env.production
PLATFORM_URL=https://[project-ref].supabase.co
PLATFORM_KEY=[service-role-key]
```

4. Deploy database schema:
> ⚠️ Warning: This will completely reset the database. Make sure you have backups if needed.
```bash
cd back
chmod +x reset-and-migrate.sh

# For development environment
./reset-and-migrate.sh dev

# For production environment
./reset-and-migrate.sh prod
```

5. Deploy Edge Functions:
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh dev    # Deploy to development
# or
./deploy-functions.sh prod   # Deploy to production
```

### 2. Frontend Setup

1. Set up environment:
```bash
cd front
cp .env.example .env.development
cp .env.example .env.production
```

2. Update environment files:
```env
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

3. Install and run:
```bash
yarn install
yarn dev
```

## Features

### Role-Based Access

- **Customers**
  - Submit and track support requests
  - Communicate with support team
  - Provide feedback on resolved issues

- **Workers**
  - Handle assigned support tickets
  - Collaborate with team members
  - Manage customer communications

- **Managers**
  - Oversee support operations
  - Manage teams and workload
  - Monitor performance and quality

### Core Features

- **Ticket Management**
  - Priority levels (low, medium, high, urgent)
  - Status tracking (new, open, pending, resolved, closed)
  - Tag system
  - Knowledge base integration

- **Communication**
  - Public and internal comments
  - Response templates
  - Real-time notifications

- **Security**
  - Row-level security (RLS)
  - Role-based access control
  - Change tracking:
    - Timestamps for all records (created, updated)
    - User attribution for all actions
    - Real-time change notifications
    - 30-day notification history

## Development vs Production

The project supports two environments:

**Development**
- Local frontend (localhost:5173)
- Development Supabase project
- Development database
- Real-time development

**Production**
- Hosted frontend
- Production Supabase project
- Production database
- Optimized performance

## Troubleshooting

### Edge Functions
- Ensure Docker Desktop is running
- Verify environment variables
- Check function logs in Supabase Dashboard
- Confirm CORS settings

### Database
- Verify RLS policies are applied
- Check table relationships and triggers
- Ensure migrations ran in correct order
- Monitor real-time subscriptions

### Frontend
- Confirm environment variables match Supabase project
- Check browser console for errors
- Verify API endpoints are accessible
- Clear browser cache if needed

## Security Notes

- Never expose service role keys
- Always use RLS policies
- Keep environment variables secure
- Regular security audits
- Monitor access logs

