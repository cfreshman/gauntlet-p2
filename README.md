# React + Supabase + LangChain Project

A modern web application built with React, Supabase, LangChain, and AWS Amplify.

## Project Structure

```
/
├── front/           # Frontend React application
└── back/            # Backend Supabase Edge Functions
```

## Quick Start

1. **Database Setup**
   - Create a new project in [Supabase](https://supabase.com)
   - Run SQL from `back/migrations/20240101000000_init.sql`
   - Enable email auth in Authentication > Providers

2. **Frontend Setup**
   ```bash
   cd front
   yarn install
   cp .env.example .env.development
   # Update .env.development with your Supabase credentials
   yarn dev
   ```

3. **Edge Functions Setup**
   ```bash
   cd back
   # Follow instructions in back/README.md
   ```

## Documentation

- Frontend: See `front/README.md`
- Backend: See `back/README.md`
- Database: See SQL comments in `back/migrations/`

## Development vs Production

This project uses separate environments:
- Development: `.env.development`
- Production: `.env.production`

See individual READMEs for detailed environment setup.