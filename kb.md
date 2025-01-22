# Knowledge Base Implementation Plan

## Week 1 Implementation

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

### 4. UI Components ✅
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

#### Customer View (`/help`) ✅
- Simple list of published articles
- Article viewer with markdown rendering

## Week 1 Final Tasks
1. Ticket feedback/rating system
2. Ticket history view
3. Bulk operations for tickets
4. Deliver a 5-min walkthrough video

## Week 2 Plans (Starting Jan 27, 2025)
1. Basic AI features:
   - Auto-route tickets based on content
   - Auto-reply for common questions
   - Suggested responses for agents
2. Maintain user roles & RLS
3. AI logic must be optional/toggleable
4. Integrate with knowledge base
5. Implement RAG system for context 