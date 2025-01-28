# auto-crm AI System

## Components

### 1. Knowledge Base Search
- Vector search using OpenAI embeddings (text-embedding-ada-002)
- Stores embeddings in `kb_embeddings` table with HNSW index
- Edge functions:
  - `generate-embedding`: Creates embeddings for any text
  - `update-kb-embedding`: Updates article embeddings on change
  - `search-kb`: Searches articles with 0.01 similarity threshold, respects RLS

### 2. Ticket Search
- Same embedding model and HNSW index
- Edge functions:
  - `generate-ticket-embedding`: Creates embeddings from ticket title, description, tags, public comments
  - `search-similar-tickets`: Returns similar tickets with 0.01 threshold, respects RLS
- Used by:
  - UI for similar ticket suggestions
  - Auto-processing for context

### 3. Auto-Processing
- Triggered on ticket creation/update
- Process:
  1. Get ticket data
  2. Search KB articles and similar tickets
  3. Fetch full content for matches
  4. Send context to GPT-4
  5. Execute suggested actions
- Actions:
  - Status updates
  - Team/worker assignment
  - Comment generation
  - KB article linking

### Security
- RLS on all tables
- Staff-only access to internal data
- Rate limiting on API calls
- Langfuse monitoring

### Integration
- Automatic embedding updates
- Real-time ticket processing
- UI components for search results
- Staff-only views for AI features 