-- Complete database setup for FAQlue demo
-- Run this in your Supabase SQL Editor

-- 1. Create faq_contexts table
CREATE TABLE IF NOT EXISTS faq_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  context_slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create faq_sources table
CREATE TABLE IF NOT EXISTS faq_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  context_id UUID NOT NULL REFERENCES faq_contexts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create faq_items table
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  context_id UUID NOT NULL REFERENCES faq_contexts(id) ON DELETE CASCADE,
  source_id UUID REFERENCES faq_sources(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(context_id, question_hash)
);

-- 4. Create faq_changes table
CREATE TABLE IF NOT EXISTS faq_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('NEW', 'UPDATED', 'STALE')),
  before_answer TEXT,
  after_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faq_items_context_id ON faq_items(context_id);
CREATE INDEX IF NOT EXISTS idx_faq_items_question_hash ON faq_items(question_hash);
CREATE INDEX IF NOT EXISTS idx_faq_items_is_published ON faq_items(is_published);
CREATE INDEX IF NOT EXISTS idx_faq_changes_item_id ON faq_changes(item_id);
CREATE INDEX IF NOT EXISTS idx_faq_changes_created_at ON faq_changes(created_at DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE faq_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_changes ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for public read access
CREATE POLICY "Allow public read access to faq_contexts" ON faq_contexts
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to faq_sources" ON faq_sources
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to faq_items" ON faq_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "Allow public read access to faq_changes" ON faq_changes
  FOR SELECT USING (true);

-- 8. Create policies for service role management
CREATE POLICY "Allow service role to manage faq_contexts" ON faq_contexts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage faq_sources" ON faq_sources
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage faq_items" ON faq_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage faq_changes" ON faq_changes
  FOR ALL USING (auth.role() = 'service_role');

-- 9. Insert test context
INSERT INTO faq_contexts (context_slug, name, description)
VALUES ('designonstock', 'Design on Stock', 'Furniture FAQ for Design on Stock')
ON CONFLICT (context_slug) DO NOTHING;

-- 10. Insert test FAQ items
INSERT INTO faq_items (context_id, question, answer, question_hash, is_published, updated_at)
VALUES 
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Kunnen jullie mijn bank herstofferen?',
    'Ja, wij bieden herstoffering van banken aan. Neem contact met ons op voor een offerte.',
    'kunnen jullie mijn bank herstofferen',
    true,
    NOW() - INTERVAL '1 day'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Wat is de actuele levertijd?',
    'De levertijd is momenteel 2-3 weken voor standaard producten.',
    'wat is de actuele levertijd',
    true,
    NOW() - INTERVAL '2 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Hoe verhuis ik mijn bank?',
    'Wij adviseren om de bank in delen te verplaatsen. Verwijder eerst de poten en kussens.',
    'hoe verhuis ik mijn bank',
    true,
    NOW() - INTERVAL '3 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Ik heb een vlek in mijn meubel. Hoe kan ik dit behandelen?',
    'Gebruik een zachte doek en specifieke reinigingsmiddelen voor uw meubelstof.',
    'ik heb een vlek in mijn meubel hoe kan ik dit behandelen',
    true,
    NOW() - INTERVAL '4 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Hoe onderhoud ik mijn meubel?',
    'Stof regelmatig af en behandel met geschikte onderhoudsproducten.',
    'hoe onderhoud ik mijn meubel',
    true,
    NOW() - INTERVAL '5 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Hoe kan ik mijn bank koppelen?',
    'Uw bank kan gekoppeld worden via onze app. Download de app en volg de instructies.',
    'hoe kan ik mijn bank koppelen',
    true,
    NOW() - INTERVAL '6 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Zit er een vuilafstotende behandeling op de bank?',
    'Ja, alle onze banken hebben een vuilafstotende behandeling voor eenvoudig onderhoud.',
    'zit er een vuilafstotende behandeling op de bank',
    true,
    NOW() - INTERVAL '7 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Ik heb een klacht/service melding op mijn meubel',
    'Neem contact op met onze klantenservice via email of telefoon voor hulp.',
    'ik heb een klacht service melding op mijn meubel',
    true,
    NOW() - INTERVAL '8 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Hoe kan ik de doppen of viltdoppen van mijn eetkamerstoelen vervangen?',
    'De doppen kunnen eenvoudig vervangen worden. Neem contact op voor vervangende doppen.',
    'hoe kan ik de doppen of viltdoppen van mijn eetkamerstoelen vervangen',
    true,
    NOW() - INTERVAL '9 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Wat kan ik doen aan een kraak in mijn bank?',
    'Kraken kunnen normaal zijn bij nieuw leer. Dit verdwijnt meestal na verloop van tijd.',
    'wat kan ik doen aan een kraak in mijn bank',
    true,
    NOW() - INTERVAL '10 days'
  )
ON CONFLICT (context_id, question_hash) DO UPDATE SET
  answer = EXCLUDED.answer,
  updated_at = EXCLUDED.updated_at;

-- 11. Insert some test changes to simulate NEW/UPDATED badges
INSERT INTO faq_changes (item_id, change_type, before_answer, after_answer, created_at)
VALUES 
  (
    (SELECT id FROM faq_items WHERE question = 'Kunnen jullie mijn bank herstofferen?' LIMIT 1),
    'NEW',
    NULL,
    'Ja, wij bieden herstoffering van banken aan. Neem contact met ons op voor een offerte.',
    NOW() - INTERVAL '1 hour'
  ),
  (
    (SELECT id FROM faq_items WHERE question = 'Wat is de actuele levertijd?' LIMIT 1),
    'UPDATED',
    'De levertijd is momenteel 3-4 weken.',
    'De levertijd is momenteel 2-3 weken voor standaard producten.',
    NOW() - INTERVAL '2 hours'
  ),
  (
    (SELECT id FROM faq_items WHERE question = 'Hoe kan ik mijn bank koppelen?' LIMIT 1),
    'NEW',
    NULL,
    'Uw bank kan gekoppeld worden via onze app. Download de app en volg de instructies.',
    NOW() - INTERVAL '3 hours'
  );

-- 12. Verify the setup
SELECT 
  'Tables created successfully' as status,
  (SELECT COUNT(*) FROM faq_contexts) as contexts,
  (SELECT COUNT(*) FROM faq_items) as items,
  (SELECT COUNT(*) FROM faq_changes) as changes;
