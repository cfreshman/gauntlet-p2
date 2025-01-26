-- Enable vector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- KB article embeddings for RAG
CREATE TABLE kb_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI embedding size
  created_at timestamptz DEFAULT now()
);

-- Create index for KB similarity search
CREATE INDEX kb_embeddings_idx ON kb_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Ticket embeddings for historical matching
CREATE TABLE ticket_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  embedding vector(1536),
  metadata jsonb, -- Store resolution info, skills used, etc.
  created_at timestamptz DEFAULT now()
);

-- Create index for ticket similarity search
CREATE INDEX ticket_embeddings_idx ON ticket_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RLS Policies

-- KB embeddings policies
ALTER TABLE kb_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read kb_embeddings"
  ON kb_embeddings FOR SELECT
  USING (true);

CREATE POLICY "System can insert kb_embeddings"
  ON kb_embeddings FOR INSERT
  WITH CHECK (true);

-- Ticket embeddings policies
ALTER TABLE ticket_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ticket_embeddings"
  ON ticket_embeddings FOR SELECT
  USING (true);

CREATE POLICY "System can insert ticket_embeddings"
  ON ticket_embeddings FOR INSERT
  WITH CHECK (true); 