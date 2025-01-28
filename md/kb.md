# Knowledge Base System

## Storage
- Supabase Storage bucket: `kb`
- Files stored as `<article_id>.md` in Markdown
- RLS policies:
  - Public read for published articles
  - Staff write access

## Database
- `kb_articles`: Metadata and visibility
- `kb_embeddings`: Vector search index
- `kb_article_tickets`: Links to resolved tickets

## Edge Functions
- `upsert-article`: Creates/updates articles and storage
- `update-kb-embedding`: Maintains embeddings
- `search-kb`: Vector search with RLS
- `generate-kb-from-ticket`: Creates articles from resolved tickets

## UI Components
- Staff Portal (`/kb`):
  - Article editor with preview
  - Publishing controls
  - Search interface
  - Version tracking

- Help Center (`/help`):
  - Public article browser
  - Semantic search
  - Mobile responsive

## Integration
- Auto-article generation from tickets
- Similar article suggestions
- Ticket context enrichment
- Search results in ticket UI 