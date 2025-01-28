-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- KB article embeddings for RAG
CREATE TABLE kb_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536), -- OpenAI embedding size
  created_at timestamptz DEFAULT now()
);

-- Create index for KB similarity search
DROP INDEX IF EXISTS kb_embeddings_idx;
CREATE INDEX kb_embeddings_idx ON kb_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Ticket embeddings for historical matching
CREATE TABLE ticket_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536),
  metadata jsonb, -- Store resolution info, skills used, etc.
  created_at timestamptz DEFAULT now()
);

-- Create index for ticket similarity search
DROP INDEX IF EXISTS ticket_embeddings_idx;
CREATE INDEX ticket_embeddings_idx ON ticket_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- RLS Policies

-- KB embeddings policies
ALTER TABLE kb_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read kb_embeddings"
  ON kb_embeddings FOR SELECT
  USING (true);

CREATE POLICY "System can insert kb_embeddings"
  ON kb_embeddings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update kb_embeddings"
  ON kb_embeddings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Ticket embeddings policies
ALTER TABLE ticket_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ticket_embeddings"
  ON ticket_embeddings FOR SELECT
  USING (true);

CREATE POLICY "System can insert ticket_embeddings"
  ON ticket_embeddings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update ticket_embeddings"
  ON ticket_embeddings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "System can delete ticket_embeddings"
  ON ticket_embeddings FOR DELETE
  USING (true);

-- Search function for KB articles
CREATE OR REPLACE FUNCTION search_kb_articles(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  min_content_length int,
  is_staff boolean
)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  storage_path text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- For small datasets, do a full table scan with L2 distance
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.summary,
    a.storage_path,
    1 - (e.embedding <-> query_embedding) as similarity
  FROM kb_embeddings e
  JOIN kb_articles a ON a.id = e.article_id
  WHERE
    -- Staff can see all articles, customers only published ones
    (is_staff OR a.published = true)
    -- Filter out empty content
    AND LENGTH(a.title) >= min_content_length
  ORDER BY e.embedding <-> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- Search function for similar tickets
CREATE OR REPLACE FUNCTION search_similar_tickets(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  requesting_user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.created_at,
    1 - (e.embedding <-> query_embedding) as similarity
  FROM ticket_embeddings e
  JOIN tickets t ON t.id = e.ticket_id
  WHERE
    -- Apply RLS: staff can see all tickets, customers only their own
    -- Skip RLS check if requesting_user_id is null (system call)
    (
      requesting_user_id IS NULL
      OR
      (
        -- Check if user is staff
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = requesting_user_id 
          AND (p.role = 'worker' OR p.role = 'manager')
        )
        -- If not staff, only show user's tickets
        OR t.created_by = requesting_user_id
      )
    )
    -- Similarity threshold
    AND 1 - (e.embedding <-> query_embedding) > match_threshold
  ORDER BY e.embedding <-> query_embedding
  LIMIT match_count;
END;
$$;

-- Add upsert function for ticket embeddings
CREATE OR REPLACE FUNCTION upsert_ticket_embedding(
  p_ticket_id uuid,
  p_embedding vector(1536),
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ticket_embeddings (ticket_id, embedding, metadata)
  VALUES (p_ticket_id, p_embedding, p_metadata)
  ON CONFLICT (ticket_id) DO UPDATE SET
    embedding = EXCLUDED.embedding,
    metadata = EXCLUDED.metadata,
    created_at = now();
END;
$$; 