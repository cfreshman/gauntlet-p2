# auto-crm Application Overview

## 1. Architecture Overview

### Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase with Edge Functions
- **Database**: PostgreSQL with RLS policies
- **Storage**: Supabase Storage for KB articles
- **Authentication**: Supabase Auth

## 2. Core Features Implemented

### A. Authentication & User Management
- Complete role system (customer, worker, manager)
- Team-based organization
- Profile management
- Invite system for team members
- Password reset flow
- Username/email management

### B. Ticket System
- Full CRUD operations
- Status tracking (new, open, pending, resolved, closed)
- Priority levels (low, medium, high, urgent)
- Assignment system with team context
- Custom fields support
- Tags and categorization
- Template system for quick responses
- Feedback and rating system

### C. Knowledge Base
- Article creation and management
- Markdown support
- Public/private article visibility
- Version tracking
- Storage integration for content

### D. Team Management
- Team creation and updates
- Member management
- Skill tracking
- Role-based permissions
- Team assignments

### E. Security Features
- Row Level Security (RLS) throughout
- Role-based access control
- Secure edge functions
- Environment separation (dev/prod)
- Proper auth token handling

## 3. Technical Implementation

### A. Frontend Structure
```
front/src/
├── components/     # UI components
├── lib/           # Utilities and hooks
├── pages/         # Route components
└── styles/        # Global styles
```

### B. Backend Structure
```
back/
├── supabase/
│   ├── functions/  # Edge functions
│   └── migrations/ # Database setup
```

## 4. Notable Features

### A. Real-time Updates
- Live notifications
- Comment updates
- Status changes
- Team modifications

### B. Custom UI Components
- Modern, accessible components
- Theme customization
- Responsive design
- Loading states

### C. Error Handling
- Form validation
- API error handling
- Fallback UI states
- Security error handling

## 5. Development Tooling
- TypeScript for type safety
- ESLint for code quality
- Tailwind for styling
- Vite for fast development
- Deployment scripts

## 6. Project Status

### Completed (✅)
- Week 1 MVP
  - Basic CRM functionality
  - User roles and permissions
  - Ticket management
  - Team organization
  
- Week 1 Final
  - Knowledge base
  - Template system
  - Feedback system
  - UI polish

### In Progress (⏳)
- Week 2 MVP (Starting Jan 27, 2025)
  - AI feature integration
  - Auto-routing
  - Response suggestions
  - Knowledge base integration

- Week 2 Final (Due Jan 31, 2025)
  - Advanced AI features
  - Learning system
  - Performance analytics
  - Final demo

## 7. Development Workflow

### Environment Setup
1. Clone repository
2. Install dependencies: `yarn install`
3. Set up environment variables
4. Start development server: `yarn dev`

### Deployment
1. Build application: `yarn build`
2. Deploy edge functions: `./back/deploy-functions.sh`
3. Run migrations: `./back/reset-and-migrate.sh`

### Environment Variables
- Development: `.env.development`
- Production: `.env.production`
- Example template: `.env.example`

## 8. Security Considerations
- All database access through RLS policies
- Edge functions for sensitive operations
- Proper role validation
- Secure environment variable handling
- Team-based access control 