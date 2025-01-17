# React + Supabase + LangChain Project

A modern web application built with React, Supabase, LangChain, and AWS Amplify.

## Tech Stack

- React 18 with TypeScript
- Supabase for backend and authentication
- LangChain for AI/ML capabilities
- AWS Amplify for deployment
- Tailwind CSS for styling
- Shadcn UI components

## Database Setup

1. Create a new project in [Supabase](https://supabase.com)

2. Copy the SQL from `supabase/migrations/20240101000000_init.sql` and run it in the Supabase SQL editor:
   - This creates the profiles table
   - Sets up Row Level Security
   - Creates functions for username-based sign in
   - Creates function for admin email updates

3. Enable email auth in Authentication > Providers:
   - Disable "Confirm email" if you want instant sign-ups
   - Keep "Secure email change" disabled to allow instant email updates

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   # For development
   cp .env.example .env.development
   # For production
   cp .env.example .env.production
   ```

4. Update the environment files:
   - `.env.development`: Development Supabase credentials
   - `.env.production`: Production Supabase credentials

5. Start the development server:
   ```bash
   yarn dev
   ```

## Development vs Production

This project uses different environments for development and production:

- **Development**:
  - Uses `.env.development`
  - Run with `yarn dev`
  - Build with `yarn build:dev`

- **Production**:
  - Uses `.env.production`
  - Build with `yarn build`
  - Preview with `yarn preview`

## Deployment

This project is configured for deployment with AWS Amplify. Follow these steps:

1. Push your changes to your repository
2. Connect your repository to AWS Amplify Console
3. Configure production environment variables in Amplify Console

## Project Structure

```
src/
  ├── components/     # React components
  ├── lib/           # Configuration files
  ├── pages/         # Page components
  ├── styles/        # Global styles
  └── types/         # TypeScript types
```

## Environment Variables

Required environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

