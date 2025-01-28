# auto-crm

Modern customer support system with AI enhancements for automating and scaling support workflows.

## Features

### Core System
- Role-based access (customer, worker, manager)
- Ticket lifecycle management
- Team organization and assignments
- Internal collaboration
- Template system
- Theme customization
- Feedback system
- Real-time notifications

### AI Features
- Auto-routing and replies
- Response suggestions
- Knowledge base integration
- RAG system for context
- Performance analytics
- Human-in-the-loop oversight

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Supabase with Edge Functions
- Database: PostgreSQL with RLS
- Storage: Supabase Storage
- Auth: Supabase Auth
- AI: OpenAI GPT-4 + Embeddings
- Analytics: Langfuse

## Documentation
- [Requirements](md/reqs.md) - Project goals and roadmap
- [App Overview](md/app.md) - System architecture
- [AI System](md/ai.md) - AI implementation
- [Knowledge Base](md/kb.md) - KB system
- [Notifications](md/notifications.md) - Real-time updates

## Quick Start

### Backend Setup
1. Create Supabase project
2. Set environment:
```bash
cd back
cp .env.example .env.development
```
3. Update `.env.development`:
```env
PLATFORM_URL=https://[project-ref].supabase.co
PLATFORM_KEY=[service-role-key]
OPENAI_API_KEY=[your-key]
```
4. Deploy:
```bash
./reset-and-migrate.sh dev
./deploy-functions.sh dev
```

### Frontend Setup
1. Set environment:
```bash
cd front
cp .env.example .env.development
```
2. Update `.env.development`:
```env
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```
3. Run:
```bash
yarn install
yarn dev
```

## Production Deployment

### Backend
Repeat dev setup with `.env.production`, then:
```bash
./reset-and-migrate.sh prod
./deploy-functions.sh prod
```

### Frontend (AWS Amplify)
1. Create new Amplify app
2. Connect to GitHub repository
3. Add environment variables from `.env.production`
4. Deploy:
- Amplify will auto-deploy on push to main
- Manual deploy via Amplify console
- Handles build and hosting automatically

### Environment Differences
- Development: Local frontend (localhost:5173)
- Production: AWS Amplify hosted frontend
- Separate Supabase projects for isolation
- Different API keys and security settings
- Production monitoring via Amplify console

## Project Structure
```
/
├── back/                  # Backend (Supabase)
│   └── supabase/           
│       ├── functions/    # Edge Functions
│       └── migrations/   # Database schemas
├── front/                # Frontend (React)
│   └── src/
│       ├── components/   # React components
│       ├── lib/         # Utilities
│       ├── pages/       # Routes
│       └── styles/      # Global styles
└── md/                  # Documentation
```

## Security
- Never expose service role keys
- Always use RLS policies
- Keep environment variables secure
- Monitor access logs

## Troubleshooting
- Verify environment variables
- Check function logs in Supabase
- Verify RLS policies
- Check browser console
- Clear cache if needed

