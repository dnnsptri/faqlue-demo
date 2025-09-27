
// Edge Function: faq-public (no external deps)
// GET /?context=designonstock            -> JSON for frontend
// GET /?context=designonstock&crawl=1    -> crawl + upsert + JSON

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔐 Secrets set via: supabase secrets set PROJECT_URL="..." ; SERVICE_ROLE_KEY="..."
const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

// --- helpers (replace/add these) ---
const QUESTION_RE =
  /(\?$)|\b(hoe|wat|waar|wanneer|welke|kan|mag|is|zijn|werkt|hoeveel|waarom|krijg|doet)\b/i;
const isQuestion = (s: string) => !!s && QUESTION_RE.test(s.trim());
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const hashQuestion = (q: string) => normalize(q);

// --- helpers (keep your normalize/hash/isQuestion; add/replace these) ---
const NOISE_RE =
  /(nieuwsbrief|magazine|verkooppunten|stalen bestellen|e-?mailadres|inschrijven|winkel|dealer|gtag|google-analytics|cookie)/i;

function supa() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stripTags(s: string) {
  return s
    .replace(/<(?:\/)?(p|li|br)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripTagsKeepBreaks(s: string) {
  return s
    .replace(/<(?:\/)?(p|li|br)\b[^>]*>/gi, "\n")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractJsonLd(html: string): any[] {
  const out: any[] = [];
  const m = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const x of m) {
    try {
      const val = JSON.parse(x[1].trim());
      if (Array.isArray(val)) out.push(...val);
      else out.push(val);
    } catch {}
  }
  return out;
}

/** Fallback capturing headings AND accordion-style buttons/summary */
function extractBlocksLoosely(html: string) {
  const h = html.replace(/\r?\n/g, " ");
  // Include button elements with aria-controls/accordion role
  const qRe = /<(h2|h3|strong|button|summary|dt)[^>]*>(.*?)<\/\1>/gi;
  const idx: Array<{ text: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = qRe.exec(h))) {
    const text = stripTagsKeepBreaks(m[2]);
    if (isQuestion(text) && !NOISE_RE.test(text) && text.length < 180) {
      idx.push({ text, start: m.index, end: m.index + m[0].length });
    }
  }
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < idx.length; i++) {
    const cur = idx[i];
    const nextStart = i + 1 < idx.length ? idx[i + 1].start : h.length;
    const raw = h.slice(cur.end, nextStart);
    const ans = stripTagsKeepBreaks(
      raw.replace(/<(header|footer|nav|form|aside)[\s\S]*?<\/\1>/gi, " ")
    );
    if (!ans || NOISE_RE.test(ans)) continue;
    if (ans.length < 40) continue; // reduced threshold to catch shorter answers too
    pairs.push({ question: cur.text, answer: ans });
  }
  return pairs;
}

/** Domain-targeted slice for designonstock: between "Veelgestelde vragen" and "Meer service" */
function sliceDosFaq(html: string) {
  const lower = html.toLowerCase();
  const start = lower.indexOf("veelgestelde vragen");
  if (start < 0) return html;
  const endCandidates = [
    lower.indexOf("meer service", start),
    lower.indexOf("©", start),
    lower.indexOf("<footer", start),
    lower.indexOf("contact", start),
    lower.indexOf("klantenservice", start),
  ].filter((i) => i > 0);
  const end = endCandidates.length ? Math.min(...endCandidates) : html.length;
  return html.slice(start, end);
}

/** Aggressive extraction: look for any text ending with ? */
function extractQuestionsAggressively(html: string) {
  const h = html.replace(/\r?\n/g, " ");
  const pairs: { question: string; answer: string }[] = [];
  
  // Find all text that ends with ? and could be questions
  const questionMatches = [...h.matchAll(/([^.!?]*\?)/gi)];
  
  for (const match of questionMatches) {
    const questionText = stripTagsKeepBreaks(match[1]).trim();
    // More strict filtering: must be a real question, not a URL or script
    if (questionText.length > 15 && 
        questionText.length < 200 && 
        !NOISE_RE.test(questionText) &&
        !questionText.includes('/') &&
        !questionText.includes('http') &&
        !questionText.includes('www') &&
        !questionText.includes('gtag') &&
        !questionText.includes('script') &&
        !questionText.includes('com/') &&
        !questionText.includes('.js') &&
        isQuestion(questionText)) {
      // Find the answer after this question
      const afterQuestion = h.slice(match.index! + match[0].length);
      const nextQuestion = afterQuestion.search(/[.!?]/);
      const answerText = stripTagsKeepBreaks(
        nextQuestion > 0 ? afterQuestion.slice(0, nextQuestion) : afterQuestion.slice(0, 500)
      ).trim();
      
      if (answerText.length > 50 && !NOISE_RE.test(answerText)) {
        pairs.push({ question: questionText, answer: answerText });
      }
    }
  }
  
  return pairs;
}

/** Extract FAQ patterns from common structures */
function extractFaqPatterns(html: string) {
  const h = html.replace(/\r?\n/g, " ");
  const pairs: { question: string; answer: string }[] = [];
  
  // Look for FAQ patterns like "Q: ... A: ..." or "Vraag: ... Antwoord: ..."
  const qaPatterns = [
    /(?:Q|Vraag):\s*([^?]*\?)\s*(?:A|Antwoord):\s*([^Q]*?)(?=Q|Vraag|$)/gi,
    /(?:Vraag|Question):\s*([^?]*\?)\s*(?:Antwoord|Answer):\s*([^V]*?)(?=Vraag|Question|$)/gi,
  ];
  
  for (const pattern of qaPatterns) {
    let match;
    while ((match = pattern.exec(h)) !== null) {
      const question = stripTagsKeepBreaks(match[1]).trim();
      const answer = stripTagsKeepBreaks(match[2]).trim();
      
      if (question.length > 10 && answer.length > 30 && 
          !NOISE_RE.test(question) && !NOISE_RE.test(answer)) {
        pairs.push({ question, answer });
      }
    }
  }
  
  return pairs;
}

/** Main extractor: prefer JSON-LD FAQ, else DOS slice + loose blocks */
function extractFaqPairs(html: string) {
  // 1) JSON-LD FAQPage
  const out: { question: string; answer: string }[] = [];
  for (const block of extractJsonLd(html)) {
    if (block && typeof block === "object" && (block as any)["@type"] === "FAQPage") {
      for (const q of (block as any).mainEntity || []) {
        const qtext = ((q?.name ?? q?.["@name"]) || "").toString().trim();
        const atext = (q?.acceptedAnswer?.text || "").toString().trim();
        if (isQuestion(qtext) && atext && !NOISE_RE.test(qtext) && !NOISE_RE.test(atext)) {
          out.push({ question: qtext, answer: atext });
        }
      }
    }
  }
  if (out.length) return out;

  // 2) Domain slice + multiple extraction methods
  const slice = sliceDosFaq(html);
  const loose = extractBlocksLoosely(slice);
  const aggressive = extractQuestionsAggressively(slice);
  const patterns = extractFaqPatterns(slice);
  
  // Combine all methods and deduplicate
  const allPairs = [...loose, ...aggressive, ...patterns];
  const uniquePairs = allPairs.filter((pair, index, self) => 
    index === self.findIndex(p => p.question.toLowerCase() === pair.question.toLowerCase())
  );
  
  if (uniquePairs.length > 0) return uniquePairs.slice(0, 12);

  // 3) Last resort on full page
  return extractBlocksLoosely(html);
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const contextSlug = url.searchParams.get("context") ?? "";
    const doCrawl = url.searchParams.get("crawl") === "1";
    if (!contextSlug) return json({ error: "Missing ?context" }, 400);

    const db = supa();

    // 1) context
    const { data: ctx, error: ctxErr } = await db
      .from("faq_contexts")
      .select("id")
      .eq("context_slug", contextSlug)
      .single();
    if (ctxErr || !ctx) return json({ error: "Context not found" }, 404);

    // 2) crawl (disabled for first version - manual input in Supabase)
    if (false && doCrawl) {
      const { data: sources } = await db
        .from("faq_sources")
        .select("id,url")
        .eq("context_id", ctx.id);

      const allCrawledPairs: { question: string; answer: string }[] = [];
      
      for (const s of sources ?? []) {
        const res = await fetch(s.url, { redirect: "follow" });
        const html = await res.text();
        const pairs = extractFaqPairs(html);
        allCrawledPairs.push(...pairs);

        for (const p of pairs) {
          // Check if this question already exists
          const { data: existingItem } = await db
            .from("faq_items")
            .select("id, answer")
            .eq("context_id", ctx.id)
            .eq("question_hash", normalize(p.question))
            .single();

          const { data: upsertedItem } = await db.from("faq_items").upsert(
            {
              context_id: ctx.id,
              source_id: s.id,
              question: p.question,
              answer: p.answer,
              question_hash: normalize(p.question),     // 👈 dedupe
              is_published: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "context_id,question_hash" }
          ).select("id").single();

          // Track changes
          if (!existingItem) {
            // New item
            await db.from("faq_changes").insert({
              item_id: upsertedItem.id,
              change_type: "NEW",
              before_answer: null,
              after_answer: p.answer,
              created_at: new Date().toISOString(),
            });
          } else if (existingItem.answer !== p.answer) {
            // Updated item
            await db.from("faq_changes").insert({
              item_id: upsertedItem.id,
              change_type: "UPDATED",
              before_answer: existingItem.answer,
              after_answer: p.answer,
              created_at: new Date().toISOString(),
            });
          }
        }
      }
      
      // After upserting new/updated items:
      const currentIds = new Set(allCrawledPairs.map(p => normalize(p.question)));

      // Find items in DB for this context that weren't in the new crawl
      const { data: existing } = await db
        .from("faq_items")
        .select("id, question, question_hash, answer")
        .eq("context_id", ctx.id);

      for (const item of existing || []) {
        if (!currentIds.has(item.question_hash)) {
          // Mark as stale in faq_changes
          await db.from("faq_changes").insert({
            item_id: item.id,
            change_type: "STALE",
            before_answer: item.answer,
            created_at: new Date().toISOString(),
          });

          // Optionally flag in faq_items too
          await db.from("faq_items").update({ is_published: false })
            .eq("id", item.id);
        }
      }
    }

    // 3) read items - show all items, ordered by specific sequence
    const { data: items } = await db
      .from("faq_items")
      .select("id,question,answer,updated_at,source_id")
      .eq("context_id", ctx.id)
      .eq("is_published", true);

    // Get badge information from faq_changes
    const { data: changes } = await db
      .from("faq_changes")
      .select("item_id, change_type, created_at")
      .in("item_id", (items ?? []).map(item => item.id))
      .order("created_at", { ascending: false });

    // Create a map of item_id to latest change type
    const changeMap = new Map();
    for (const change of changes ?? []) {
      if (!changeMap.has(change.item_id)) {
        changeMap.set(change.item_id, change.change_type);
      }
    }

    // Add badge information to items
    const itemsWithBadges = (items ?? []).map(item => {
      const changeType = changeMap.get(item.id);
      let badge = null;
      
      if (changeType === "NEW") {
        badge = "NEW";
      } else if (changeType === "UPDATED") {
        badge = "UPDATED";
      } else if (changeType === "STALE") {
        badge = "STALE";
      }
      
      return {
        ...item,
        badge
      };
    });

    // Define the specific order based on the reference image
    const questionOrder = [
      "Hoe kan ik mijn bank koppelen?",
      "Zit er een vuilafstotende behandeling op de bank?",
      "Kunnen jullie mijn meubel herstofferen?",
      "Ik heb een klacht/service melding op mijn meubel",
      "Wat kan ik doen aan een kraak in mijn bank?",
      "Hoe onderhoud ik mijn meubel?",
      "Hoe kan ik de doppen of viltdoppen van mijn eetkamerstoelen vervangen?",
      "Ik heb een vlek in mijn meubel. Hoe kan ik dit behandelen?",
      "Hoe verhuis ik mijn bank?",
      "Wat is de actuele levertijd?"
    ];

    // Helper: badge priority (NEW -> UPDATED -> none -> STALE)
    const getBadgePriority = (badge: string | null) =>
      badge === "NEW" ? 0 : badge === "UPDATED" ? 1 : badge === "STALE" ? 3 : 2;

    // Sort items by badge priority first, then by predefined question order
    const orderedItems = itemsWithBadges.sort((a, b) => {
      const pa = getBadgePriority(a.badge as any);
      const pb = getBadgePriority(b.badge as any);
      if (pa !== pb) return pa - pb;

      const indexA = questionOrder.findIndex(q => 
        a.question.toLowerCase().includes(q.toLowerCase()) || 
        q.toLowerCase().includes(a.question.toLowerCase())
      );
      const indexB = questionOrder.findIndex(q => 
        b.question.toLowerCase().includes(q.toLowerCase()) || 
        q.toLowerCase().includes(b.question.toLowerCase())
      );

      // If both items are found in the order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one is found, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is found, maintain original order
      return 0;
    });

    return json({ context: contextSlug, items: orderedItems });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});