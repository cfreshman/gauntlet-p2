-- Create table to track which tickets have generated KB articles
CREATE TABLE kb_article_tickets (
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (article_id, ticket_id)
);

-- Enable RLS
ALTER TABLE kb_article_tickets ENABLE ROW LEVEL SECURITY;

-- Add view policies matching kb_articles
CREATE POLICY "Everyone can view published article links"
  ON kb_article_tickets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kb_articles
    WHERE id = article_id
    AND published = true
  ));

CREATE POLICY "Workers can view all article links"
  ON kb_article_tickets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('worker', 'manager')
  ));

CREATE POLICY "Managers can manage article links"
  ON kb_article_tickets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'manager'
  ));

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE kb_article_tickets; 