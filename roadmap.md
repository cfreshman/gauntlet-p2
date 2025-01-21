# roadmap.md

## AutoCRM Roadmap

Below is the simplified roadmap to guide development across two weeks. Each week has an MVP milestone and a final milestone.

---

### **Currently Implemented** ✅
- **Auth & Users**  
  - Sign up, sign in, password reset  
  - Role system: customer, worker, manager  
  - Profile management  
  - Team creation and management  
  - Invite system (magic links)  
  - Workers can see team members  

- **Tickets**  
  - Basic CRUD (create, read, update, delete)  
  - Status and priority management  
  - Assignment system (managers ⇄ workers, self-assign)  
  - Comment system with real-time updates  
  - Permission-based access  
  - Usernames displayed in comments  
  - All roles can create tickets  

- **Security**  
  - Row Level Security (RLS) policies in the database  
  - Edge Functions for sensitive operations (ticket updates, profile updates, team management)  
  - Team- and role-based access control  

- **Database**  
  - Core tables: `profiles`, `teams`, `tickets`, `comments`  
  - Additional schemas prepared for: custom fields, tags, skills  
  - Team invite flow  
  - Real-time enabled tables  

- **UI**  
  - Responsive layouts  
  - Real-time ticket updates  
  - Key pages: auth, tickets, settings  
  - Team management interface  

---

## Week 1

### **MVP (Due: Jan 21, 2025)**
1. **Functional Baseline CRM**  
   - Confirm that tickets can be created, updated, and closed  
   - Ensure role-based permissions (customer, worker, manager)  
   - Validate RLS policies and edge functions remain intact

2. **Minimal Enhancements**  
   - Basic queue or list view for tickets  
   - Basic filtering (by status or priority)  
   - Fix any blocking issues (e.g., unknown username in comments)

3. **Deployment**  
   - Working, deployable application  
   - Publicly accessible URL

### **Final (Due: Jan 24, 2025)**
1. **Core Enhancements**  
   - Polish UI for ticket assignment, status changes, and comments  
   - Ensure team management permissions are correct  
   - Implement or verify minimal “internal notes” concept (if requested)  
   - Confirm security: email visibility, RLS coverage

2. **Customer Features**  
   - Validate that customers can see and comment on their tickets  
   - Optional: basic feedback mechanism or rating system

3. **Walkthrough & Submission**  
   - 5-minute demo video covering ticket lifecycle  
   - GitHub repo link with final code  
   - Post on X (if applicable), showing engagement  

---

## Week 2

### **MVP (Due: Jan 27, 2025)**
1. **AI Integration Kickoff**  
   - Basic AI routing or auto-response feature introduced (LLM-generated replies)  
   - Keep existing permission and security logic intact  
   - RAG-based knowledge approach (if applicable) starts here

2. **Edge Functions for AI**  
   - Use or expand Supabase Edge Functions to handle AI calls  
   - Ensure toggles/overrides for human review

3. **Testing & Validation**  
   - Basic tests verifying AI interactions do not break ticket flows  
   - Demo AI-generated response or recommended resolution

### **Final (Due: Jan 31, 2025)**
1. **Advanced AI Features**  
   - Refine self-service with AI: possibly a small knowledge base or chatbot flow  
   - AI-based ticket assignment or escalation  
   - (Optional) Summaries or real-time dashboards for managers

2. **Human-in-the-Loop**  
   - Smooth process for workers/managers to review AI responses  
   - Additional queue or status for AI-suggested tickets

3. **Final Demo & Submission**  
   - 5-minute demo showcasing AI-driven ticket lifecycle  
   - Updated GitHub repo + product post  
   - Publicly accessible deployment

---

## Non-Essential / Future Backlog
- Custom fields & advanced ticket schemas  
- Tag system with filtering  
- Skills-based routing  
- Multi-channel support (chat, social, SMS)  
- Comprehensive knowledge base, self-service tools  
- Deep performance optimizations (caching, advanced indexing)

---

