# auto-crm AI Implementation Plan

## Core Features
1. KB Article RAG
2. Historical Ticket RAG  
3. Ticket Processing Agent

## Implementation Phases

### Phase 1: KB Article RAG (Day 1-2)

1. Infrastructure
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

2. Edge Functions
- `generate-embedding`: Convert text to OpenAI embedding
- `update-kb-embedding`: Create/update article embeddings
- `search-kb`: Similarity search KB articles

3. Integration
- Hook into KB article creation/update
- Add embedding generation to article workflow
- Implement basic similarity search API

### Phase 2: Historical Ticket RAG (Day 3)

1. Infrastructure
```sql
-- Ticket embeddings
CREATE TABLE ticket_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  embedding vector(1536),
  metadata jsonb, -- Store resolution info, skills used, etc.
  created_at timestamptz DEFAULT now()
);

-- Create index for similarity search
CREATE INDEX ticket_embeddings_idx ON ticket_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

2. Edge Functions
- `update-ticket-embedding`: Create ticket embeddings
- `search-tickets`: Similarity search historical tickets

3. Integration
- Add embedding generation to ticket resolution
- Store relevant metadata (skills, team, resolution)
- Implement ticket similarity search

### Phase 3: Ticket Processing Agent (Day 4-5)

1. Edge Functions
- `process-new-ticket`: Main agent logic
  1. Generate ticket embedding
  2. Search KB articles
  3. Search historical tickets
  4. Make action decision
  5. Execute action (create comment or update ticket)

2. Integration Points
- Hook into ticket creation flow
- Add AI processing to ticket view
- Show matches in UI
- Allow manual override

## Implementation Order

1. KB RAG First
   - Set up vector storage
   - Implement embedding generation
   - Build similarity search

2. Add Ticket RAG
   - Reuse embedding infrastructure
   - Add ticket metadata storage
   - Implement ticket search

3. Processing Agent
   - Build decision tree logic
   - Integrate with ticket flow 