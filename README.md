# React + Supabase + LangChain Project

A modern web application built with React, Supabase, LangChain, and AWS Amplify.

## Tech Stack

- React 18 with TypeScript
- Supabase for backend and authentication
- LangChain for AI/ML capabilities
- AWS Amplify for deployment
- Tailwind CSS for styling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials:
   - Supabase credentials from your Supabase project

5. Start the development server:
   ```bash
   yarn dev
   ```

## Deployment

This project is configured for deployment with AWS Amplify. Follow these steps:

1. Push your changes to your repository
2. Connect your repository to AWS Amplify Console
3. Configure environment variables in Amplify Console

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
