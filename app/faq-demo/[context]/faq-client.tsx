"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  badge?: "NEW" | "UPDATED" | "STALE" | null;
  updated_at?: string;
  change?: { before_answer?: string; after_answer?: string };
};

type FaqResponse = {
  context: string;
  items: FaqItem[];
  stats?: { total: number; new: number; updated: number; stale: number };
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function highlight(text: string, q: string) {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="rounded px-1">{p}</mark>
      : <span key={i}>{p}</span>
  );
}

function BadgePill({ kind }: { kind?: FaqItem["badge"] }) {
  if (!kind || kind === "STALE") return null;
  const label = kind === "NEW" ? "Nieuw" : "Bijgewerkt";
  const cls = "ml-2 inline-flex items-center rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700";
  return <span className={cls}>{label}</span>;
}



export default function FaqClient({ context }: { context: string }) {
  const [query, setQuery] = React.useState("");
  const [data, setData] = React.useState<FaqResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const MAX_VISIBLE = 12;
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

  // Log search events
  const logSearch = async (searchQuery: string) => {
    try {
      await fetch("/api/faq/hit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, type: "search", query: searchQuery }),
      });
    } catch (error) {
      console.error("Failed to log search:", error);
    }
  };

  // Log click events
  const logClick = async (itemId: string) => {
    try {
      await fetch("/api/faq/hit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, type: "click", item_id: itemId }),
      });
    } catch (error) {
      console.error("Failed to log click:", error);
    }
  };



  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/faq/${context}`, { cache: "no-store" });
      const json = (await res.json()) as FaqResponse;
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [context]);

  function scoreItem(it: FaqItem, q: string) {
    // Only use search-based scoring, not click-based
    if (q) {
      const Q = q.toLowerCase();
      const inQ = it.question.toLowerCase().includes(Q) ? 10 : 0;
      const inA = it.answer.toLowerCase().includes(Q) ? 6 : 0;
      const posQ = it.question.toLowerCase().indexOf(Q);
      const posA = it.answer.toLowerCase().indexOf(Q);
      const firstPos = [posQ, posA].filter((p) => p >= 0).sort((a, b) => a - b)[0] ?? 1e9;
      const posBonus = firstPos < 1e9 ? Math.max(4 - Math.log2(firstPos + 1), 0) : 0;
      return inQ + inA + posBonus;
    }
    // For non-search queries, return 0 to maintain original order from Supabase
    return 0;
  }

  // Filter by search (client-side), then sort by score, then cap to 12
  const filtered = React.useMemo(() => {
    if (!data?.items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.items;
    return data.items.filter(
      (it) =>
        it.question.toLowerCase().includes(q) || it.answer.toLowerCase().includes(q)
    );
  }, [data, query]);

  const sorted = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...filtered].sort((a, b) => scoreItem(b, q) - scoreItem(a, q));
  }, [filtered, query]);

  const items = React.useMemo(() => sorted.slice(0, MAX_VISIBLE), [sorted]);


  if (loading) return <div>Vragen worden opgehaald…</div>;
  if (!data) return <div>Geen data.</div>;

  console.log('FAQ Data:', { 
    data, 
    items: items.length, 
    query, 
    filtered: filtered.length, 
    sorted: sorted.length,
    rawItems: data?.items?.length 
  });

  return (
    <section className="space-y-8">
      <div className="mx-auto w-full max-w-[620px] px-4 sm:px-0">
        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Ik ben op zoek naar ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-28"
            aria-label="Zoek in veelgestelde vragen"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            <Button 
              onClick={() => {
                if (query.trim()) {
                  logSearch(query.trim());
                }
                setQuery("");
              }} 
              className="px-3 py-2 text-sm"
            >
              Filter
            </Button>
          </div>
        </div>

        {/* Tiny stats (optional) */}
        {data.stats && (data.stats.new > 0 || data.stats.updated > 0) && (
          <div className="mt-4 text-sm text-muted-foreground">
            Nieuw: {data.stats.new} · Bijgewerkt: {data.stats.updated}
          </div>
        )}


        {/* FAQ list */}
        <div className="mt-8 divide-y divide-black/20">
          {items.map((item) => {
            const isOpen = openItems.has(item.id);
            return (
              <div key={item.id} className="group py-3">
                <button 
                  className="flex w-full cursor-pointer items-start text-left"
                  onClick={() => {
                    setOpenItems(prev => {
                      const newSet = new Set(prev);
                      if (isOpen) {
                        newSet.delete(item.id);
                      } else {
                        newSet.add(item.id);
                        // Log click when opening an item
                        logClick(item.id);
                      }
                      return newSet;
                    });
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-semibold">
                      {highlight(item.question, query)}
                    </span>
                  </div>
                  <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                    <BadgePill kind={item.badge} />
                    <svg className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="pt-2">
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">{highlight(item.answer, query)}</div>

                    {(item.badge === "UPDATED" || item.badge === "STALE") && item.change && (
                      <div className="mt-3">
                        <details>
                          <summary className="cursor-pointer text-sm font-medium">Bekijk wijziging</summary>
                          <div className="grid gap-4 pt-2 md:grid-cols-2">
                            <div>
                              <h4 className="mb-2 text-sm font-medium">Voor</h4>
                              <div className="h-56 overflow-auto rounded border p-3 text-sm whitespace-pre-wrap">
                                {item.change.before_answer || "—"}
                              </div>
                            </div>
                            <div>
                              <h4 className="mb-2 text-sm font-medium">Na</h4>
                              <div className="h-56 overflow-auto rounded border p-3 text-sm whitespace-pre-wrap">
                                {item.change.after_answer || "—"}
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Geen resultaten voor "{query}".</p>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Nog steeds geen resultaat? Neem dan contact op via ons{" "}
                  <a
                    href="https://www.designonstock.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black underline hover:no-underline"
                  >
                    contactformulier
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}