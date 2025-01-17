# Frontend Application

React application with Supabase authentication and Shadcn UI components.

## Quick Start

1. Install dependencies:
```bash
yarn install
```

2. Set up environment:
```bash
# Copy example env file
cp .env.example .env.development

# Update with your Supabase credentials:
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. Start development server:
```bash
yarn dev
```

## Build

- Development:
```bash
yarn build:dev
```

- Production:
```bash
yarn build
```

## Deployment

This project is configured for AWS Amplify:

1. Connect your repository in Amplify Console
2. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy using the included `amplify.yml`

## Project Structure

```
src/
  ├── components/     # React components
  ├── lib/           # Configuration and hooks
  ├── pages/         # Page components
  └── styles/        # Global styles
```

