# auto-crm AI Implementation Plan

## Core Features
1. KB Article RAG
2. Historical Ticket RAG  
3. Ticket Processing Agent

## Implementation Progress

### Phase 1: KB Article RAG (✅ Complete)

1. ✅ Infrastructure
```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- KB article embeddings
CREATE TABLE kb_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI embedding size
  created_at timestamptz DEFAULT now()
);

-- Create index for similarity search
CREATE INDEX kb_embeddings_idx ON kb_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

2. ✅ Edge Functions
- ✅ `generate-embedding`: Convert text to OpenAI embedding
  - Takes text input
  - Returns 1536-dimensional embedding vector
  - Uses OpenAI's text-embedding-ada-002 model

- ✅ `update-kb-embedding`: Create/update article embeddings
  - Called automatically from upsert-article
  - Receives title and content directly
  - Generates embeddings for all articles (both published/unpublished)

- ✅ `search-kb`: Similarity search KB articles
  - Implements visibility rules:
    - Customers: only published articles
    - Staff: all articles
  - Returns most similar articles with scores
  - Includes configurable thresholds and limits

3. ✅ Integration
- ✅ Hook into KB article creation/update
- ✅ Add embedding generation to article workflow
- ✅ Implement similarity search API with RLS

### Phase 2: Historical Ticket RAG (🔄 In Progress)

1. ✅ Infrastructure
- ✅ Created ticket_embeddings table
- ✅ Added vector indexing
- ✅ Implemented RLS policies

2. 🔄 Edge Functions (In Progress)
- 🔄 `generate-ticket-embedding`: Convert ticket data to embedding
  - Will include title, description, resolution
  - Need to handle metadata extraction
- 🔄 `search-similar-tickets`: Find similar historical tickets
  - Will help agents find relevant past solutions
  - Need to implement scoring and filtering

3. ⏳ Integration (Not Started)
- Need to hook into ticket workflow
- Add embedding updates on status changes
- Build UI for viewing similar tickets

### Phase 3: Ticket Processing Agent (⏳ Not Started)

1. Planning
- Design decision tree for ticket routing
- Define auto-response criteria
- Plan human oversight mechanisms

2. Implementation
- Build processing pipeline
- Integrate with existing ticket flow
- Add monitoring and feedback loop

3. Features to Build
- Auto-categorization
- Response suggestions
- Priority scoring
- Escalation rules

## Implementation Order

1. ✅ KB RAG Complete
   - ✅ Set up vector storage
   - ✅ Implement embedding generation
   - ✅ Build similarity search

2. 🔄 Historical Ticket RAG (Current Focus)
   - ✅ Reuse embedding infrastructure
   - ✅ Add ticket metadata storage
   - 🔄 Implement ticket search
   - ⏳ Build agent UI integration

3. ⏳ Processing Agent (Next Phase)
   - Design decision workflows
   - Implement processing pipeline
   - Add monitoring and controls 