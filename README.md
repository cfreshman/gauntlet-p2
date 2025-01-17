# React + Supabase + LangChain Project

A modern web application built with React, Supabase, LangChain, and AWS Amplify.

## Project Structure

```
/
├── front/           # Frontend React application
└── back/            # Backend Supabase Edge Functions
```

## Complete Setup Guide

1. **Environment Setup**
   
   Required tools (instructions provided for macOS):
   - Supabase CLI
     ```bash
     brew install supabase/tap/supabase
     supabase login
     ```

   - Docker Desktop
     ```bash
     brew install --cask docker
     
     # Start Docker
     open -a Docker
     ```

   - Node.js & Yarn

   Create all environment files:
   ```bash
   # Frontend
   cp front/.env.example front/.env.development
   cp front/.env.example front/.env.production
   
   # Backend
   cp back/.env.example back/.env.development
   cp back/.env.example back/.env.production
   ```

2. **Supabase Setup**
   
   Development Project:
   1. Go to [Supabase](https://supabase.com)
   2. Click "New project"
   3. Choose organization or create new
   4. Set project name (e.g. "my-app-dev")
   5. Set database password
   6. Choose region
   7. Wait for setup to complete
   8. In project dashboard:
      - Go to Settings > API
      - Copy "Project URL" into VITE_SUPABASE_URL in front/.env.development
      - Copy "anon public" key into VITE_SUPABASE_ANON_KEY in front/.env.development
      - Copy "Project URL" into PLATFORM_URL in back/.env.development
      - Copy "service_role secret" key into PLATFORM_KEY in back/.env.development
      - Go to Authentication > Providers > Email
      - Turn OFF "Confirm email"

   Production Project:
   1. Repeat steps 1-7 with:
      - Different name (e.g. "my-app-prod")
      - Same region as dev
   2. Copy keys from Settings > API:
      - Copy "Project URL" into VITE_SUPABASE_URL in front/.env.production
      - Copy "anon public" key into VITE_SUPABASE_ANON_KEY in front/.env.production
      - Copy "Project URL" into PLATFORM_URL in back/.env.production
      - Copy "service_role secret" key into PLATFORM_KEY in back/.env.production

3. **Database Setup**
   ```bash
   # In both dev and prod projects:
   1. Go to SQL Editor
   2. Copy contents of back/migrations/20240101000000_init.sql
   3. Paste into SQL Editor
   4. Click "Run" to create tables and functions
   ```

4. **Edge Functions Setup**
   ```bash
   cd back
   
   # Development
   cp .env.example .env.development
   # Edit .env.development:
   PLATFORM_URL=https://[DEV_PROJECT_URL]
   PLATFORM_KEY=[DEV_SERVICE_ROLE_KEY]
   
   # Deploy dev function
   supabase secrets set --env-file .env.development --project-ref [DEV_PROJECT_ID]
   supabase functions deploy sign-in-with-username --project-ref [DEV_PROJECT_ID]
   
   # Production (after testing dev)
   cp .env.example .env.production
   # Edit .env.production:
   PLATFORM_URL=https://[PROD_PROJECT_URL]
   PLATFORM_KEY=[PROD_SERVICE_ROLE_KEY]
   
   # Deploy prod function
   supabase secrets set --env-file .env.production --project-ref [PROD_PROJECT_ID]
   supabase functions deploy sign-in-with-username --project-ref [PROD_PROJECT_ID]
   ```

5. **Frontend Setup**
   ```bash
   cd front
   yarn install
   
   # Development
   cp .env.example .env.development
   # Edit .env.development:
   VITE_SUPABASE_URL=https://[DEV_PROJECT_URL]
   VITE_SUPABASE_ANON_KEY=[DEV_ANON_KEY]
   
   # Test locally
   yarn dev
   
   # Production
   cp .env.example .env.production
   # Edit .env.production:
   VITE_SUPABASE_URL=https://[PROD_PROJECT_URL]
   VITE_SUPABASE_ANON_KEY=[PROD_ANON_KEY]
   ```

6. **AWS Amplify Setup**
   1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   2. Click "New app" > "Host web app"
   3. Choose GitHub
   4. Select your repository
   5. Keep default build settings (uses amplify.yml)
   6. Add environment variables:
      ```
      VITE_SUPABASE_URL=https://[PROD_PROJECT_URL]
      VITE_SUPABASE_ANON_KEY=[PROD_ANON_KEY]
      ```
   7. Click "Save and deploy"

## Development vs Production

This project uses separate environments:
- Development:
  - Local frontend (localhost:5173)
  - Dev Supabase project
  - Dev Edge Functions
  - Dev database

- Production:
  - AWS Amplify hosted frontend
  - Prod Supabase project
  - Prod Edge Functions
  - Prod database

## Documentation

- Frontend: See `front/README.md`
- Backend: See `back/README.md`
- Database: See SQL comments in `back/migrations/`

## Troubleshooting

1. **Edge Function Errors**
   - Docker Desktop must be running
   - Check project refs in commands match Supabase URLs
   - Verify environment variables are set
   - Check Docker has enough memory (4GB minimum)

2. **Frontend Errors**
   - URLs must include https://
   - Keys must match environment (dev/prod)
   - Check browser console for CORS errors

3. **Database Errors**
   - SQL must be run in both projects
   - Check Settings > Database for connection issues
   - Verify RLS policies in SQL Editor > Policies