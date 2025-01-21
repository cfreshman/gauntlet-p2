# AutoCRM

A modern customer support system with ticket management and role-based access.

## Overview

AutoCRM provides:
- Ticket management with role-based access
- Customer support portal
- Team management and assignment
- Comment system with internal notes

## Project Structure

```
/
├── back/               # Backend (Supabase)
│   ├── supabase/      
│   │   ├── functions/ # Edge Functions
│   │   └── migrations # Database schemas
│   └── deploy-functions.sh
│
└── front/             # Frontend (React)
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
- Copy SQL from `back/supabase/migrations`
- Run in Supabase SQL Editor for both projects

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
  - Create tickets
  - Add comments
  - View ticket status

- **Workers**
  - View assigned tickets
  - Update ticket status
  - Add internal notes
  - Respond to customers

- **Managers**
  - Full ticket access
  - Manage teams
  - Assign workers
  - Set user roles

## Development vs Production

The project supports two environments:

**Development**
- Local frontend (localhost:5173)
- Development Supabase project
- Development database

**Production**
- Hosted frontend
- Production Supabase project
- Production database

## Troubleshooting

### Edge Functions
- Ensure Docker Desktop is running
- Verify environment variables
- Check function logs in Supabase Dashboard

### Database
- Verify RLS policies are applied
- Check table relationships
- Ensure migrations ran successfully

### Frontend
- Confirm environment variables match Supabase project
- Check browser console for errors
- Verify API endpoints are accessible