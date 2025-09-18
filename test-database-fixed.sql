-- Test data for FAQlue demo (Fixed for existing schema)
-- Run this in your Supabase SQL editor

-- 1. Insert test context if it doesn't exist (without description column)
INSERT INTO faq_contexts (context_slug, name)
VALUES ('designonstock', 'Design on Stock')
ON CONFLICT (context_slug) DO NOTHING;

-- 2. Insert test FAQ items
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

-- 3. Insert some test changes to simulate NEW/UPDATED badges
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

-- 4. Test the API endpoint
-- After running this, test: GET /api/faq/designonstock
