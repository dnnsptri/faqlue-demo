-- Table to store events for server-side ranking
create table if not exists faq_events (
  id uuid primary key default gen_random_uuid(),
  context_id uuid references faq_contexts(id) on delete set null,
  item_id uuid references faq_items(id) on delete cascade,
  event_type text not null check (event_type in ('search','click')),
  query text,
  created_at timestamptz not null default now()
);

create index if not exists idx_faq_events_item_time on faq_events(item_id, created_at desc);
create index if not exists idx_faq_events_type_time on faq_events(event_type, created_at desc);

alter table faq_events enable row level security;
create policy "public read faq_events" on faq_events for select using (true);
create policy "service role manage faq_events" on faq_events for all using (auth.role() = 'service_role');
