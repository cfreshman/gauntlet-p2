# auto-crm Application Overview

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Supabase with Edge Functions
- Database: PostgreSQL with RLS
- Storage: Supabase Storage
- Auth: Supabase Auth
- AI: OpenAI GPT-4 + Embeddings
- Analytics: Langfuse

## Core Features

### User System
- Roles: customer, worker, manager
- Team organization and skills
- Profile and invite management
- RLS policies

### Tickets
- CRUD with real-time updates
- Status (new, open, pending, resolved, closed)
- Priority (low, medium, high, urgent)
- Team assignments
- Custom fields and tags
- Templates and feedback
- AI features:
  - Auto-routing
  - Response suggestions
  - Similar ticket matching
  - Ticket summaries
  - Performance analytics

### Knowledge Base
- Article management with versions
- Public/private visibility
- Markdown support
- AI integration:
  - Semantic search
  - Auto-generation from tickets
  - RAG for context

### Security
- Row Level Security (RLS)
- Role-based access
- Secure edge functions
- Environment separation
- Auth token handling

## Project Structure
```
front/src/
├── components/    # UI components
├── lib/          # Utilities
├── pages/        # Routes
└── styles/       # Global styles

back/supabase/
├── functions/    # Edge functions
└── migrations/   # Database setup
```

## Development
- Install: `yarn install`
- Environment: Copy `.env.example`
- Dev server: `yarn dev`
- Deploy:
  1. `yarn build`
  2. `./back/deploy-functions.sh`
  3. `./back/reset-and-migrate.sh`

## Environment Variables
Required:
- Supabase credentials (URL, keys)
- OpenAI API key
- Langfuse keys (optional)