-- Create faq_changes table to track changes to FAQ items
CREATE TABLE IF NOT EXISTS faq_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('NEW', 'UPDATED', 'STALE')),
  before_answer TEXT,
  after_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_faq_changes_item_id ON faq_changes(item_id);
CREATE INDEX IF NOT EXISTS idx_faq_changes_created_at ON faq_changes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE faq_changes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to faq_changes" ON faq_changes
  FOR SELECT USING (true);

-- Create policy to allow service role to insert/update
CREATE POLICY "Allow service role to manage faq_changes" ON faq_changes
  FOR ALL USING (auth.role() = 'service_role');
