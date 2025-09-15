-- Test data for FAQlue demo
-- Run this in your Supabase SQL editor

-- 1. Insert test context if it doesn't exist
INSERT INTO faq_contexts (context_slug, name, description)
VALUES ('designonstock', 'Design on Stock', 'Furniture FAQ')
ON CONFLICT (context_slug) DO NOTHING;

-- 2. Get the context ID
-- (You'll need to replace this with the actual ID from your database)
-- SELECT id FROM faq_contexts WHERE context_slug = 'designonstock';

-- 3. Insert test FAQ items
INSERT INTO faq_items (context_id, question, answer, is_published, updated_at)
VALUES 
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Kunnen jullie mijn bank herstofferen?',
    'Ja, wij bieden herstoffering van banken aan. Neem contact met ons op voor een offerte.',
    true,
    NOW() - INTERVAL '1 day'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Wat is de actuele levertijd?',
    'De levertijd is momenteel 2-3 weken voor standaard producten.',
    true,
    NOW() - INTERVAL '2 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Hoe verhuis ik mijn bank?',
    'Wij adviseren om de bank in delen te verplaatsen. Verwijder eerst de poten en kussens.',
    true,
    NOW() - INTERVAL '3 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Ik heb een vlek in mijn meubel. Hoe kan ik dit behandelen?',
    'Gebruik een zachte doek en specifieke reinigingsmiddelen voor uw meubelstof.',
    true,
    NOW() - INTERVAL '4 days'
  ),
  (
    (SELECT id FROM faq_contexts WHERE context_slug = 'designonstock'),
    'Hoe onderhoud ik mijn meubel?',
    'Stof regelmatig af en behandel met geschikte onderhoudsproducten.',
    true,
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (context_id, question) DO UPDATE SET
  answer = EXCLUDED.answer,
  updated_at = EXCLUDED.updated_at;

-- 4. Insert some test changes to simulate NEW/UPDATED badges
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
  );

-- 5. Test the API endpoint
-- After running this, test: GET /api/faq/designonstock
