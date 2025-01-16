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
   npm install
   ```

3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials:
   - Supabase credentials from your Supabase project
   - AWS Amplify configuration from your AWS Console

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for deployment with AWS Amplify. Follow these steps:

1. Install and configure the AWS Amplify CLI
2. Initialize your Amplify project
3. Push your changes to your repository
4. Connect your repository to AWS Amplify Console

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
- `VITE_AWS_REGION`: AWS region
- `VITE_USER_POOL_ID`: Cognito User Pool ID
- `VITE_USER_POOL_CLIENT_ID`: Cognito Client ID
