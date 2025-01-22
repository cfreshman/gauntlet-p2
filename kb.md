# Knowledge Base Implementation Plan

## Current Implementation

### 1. Storage Setup ✅
- Create a `kb` bucket in Supabase Storage
- Structure: `kb/<article_id>.md`
- Simple RLS policies:
  ```sql
  -- Anyone can read published articles
  CREATE POLICY "Anyone can read published articles"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kb' AND EXISTS (
    SELECT 1 FROM kb_articles
    WHERE storage_path = name
    AND published = true
  ));

  -- Workers and managers can manage articles
  CREATE POLICY "Staff can manage articles"
  ON storage.objects FOR ALL
  USING (bucket_id = 'kb' AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker', 'manager')
  ));
  ```

### 2. Database Tables ✅
- `kb_articles` table:
  ```sql
  CREATE TABLE kb_articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    summary text,
    storage_path text NOT NULL,
    published boolean DEFAULT false,
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid references auth.users(id) on delete set null
  );
  ```

### 3. Edge Functions ✅
- `upsert-article`: Create/update article
  - Input: title, content, summary?, published?
  - Stores content in Storage as markdown
  - Updates article record with metadata
  - Enforces permissions:
    - Only workers/managers can create/edit
    - Only managers can publish
    - Workers can only edit their own articles
  - Handles versioning

### 4. UI Components (In Progress)
#### Staff View (`/kb`)
- List of all articles with:
  - Title
  - Published status
  - Edit/Delete actions
- Article editor:
  - Title field
  - Markdown editor
  - Publish toggle
- Article viewer with markdown rendering

#### Customer View (`/kb/help`)
- Simple list of published articles
- Article viewer with markdown rendering

### 5. Implementation Order
1. ✅ Storage setup
2. ✅ Database tables
3. ✅ Basic CRUD function
4. Staff UI for article management
5. Customer UI for viewing articles

## Next Week: AI Features
1. Add tags support for RAG context
2. Implement semantic search
3. Add embeddings for article content
4. Build RAG integration:
   - Auto-replies using KB
   - Response suggestions
   - Context-aware assistance
   - Smart article recommendations 