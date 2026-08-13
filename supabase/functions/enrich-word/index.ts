// ═══════════════════════════════════════════════════════════
// Kalima — enrich-word
//
// التدفق:
//   تطبيع → كاش القاموس → حد الاستخدام → Gemini → تحقق → نطق → حفظ
//
// الكلمة بتتولّد بالـ AI مرة واحدة في عمر التطبيق. أي مستخدم بعد كده
// بياخدها من الكاش فورًا وبتكلفة صفر.
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, fail, json } from "../_shared/cors.ts";
import { callGemini, MODEL, sanitizeQuestions } from "./gemini.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const DAILY_LIMIT = Number(Deno.env.get("AI_DAILY_LIMIT") ?? "30");

const WORD_RE = /^[a-zA-Z][a-zA-Z\s'-]{0,48}$/;

function normalize(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/** نطق بشري مجاني من dictionaryapi.dev — بدون مفتاح */
async function fetchAudio(word: string): Promise<{ audio: string; ipa: string }> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: ctl.signal },
    );
    clearTimeout(t);
    if (!r.ok) return { audio: "", ipa: "" };

    const data = await r.json();
    const phonetics = data?.[0]?.phonetics ?? [];
    const withAudio = phonetics.find((p: { audio?: string }) => p?.audio);
    const withText = phonetics.find((p: { text?: string }) => p?.text);
    return {
      audio: withAudio?.audio ?? "",
      ipa: withText?.text ?? data?.[0]?.phonetic ?? "",
    };
  } catch {
    return { audio: "", ipa: "" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return fail("method_not_allowed", "الطلب غير مدعوم", 405);
  }

  // ── 1. المصادقة ──────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return fail("unauthenticated", "لازم تسجّل دخول الأول", 401);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return fail("unauthenticated", "الجلسة انتهت، سجّل دخول تاني", 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // ── 2. المدخلات ──────────────────────────────────────────
  let body: { word?: string; add?: boolean };
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", "طلب غير صالح", 400);
  }

  const rawWord = String(body.word ?? "");
  const word = normalize(rawWord);

  if (!word) return fail("empty", "اكتب كلمة الأول", 400);
  if (!WORD_RE.test(word)) {
    return fail(
      "not_english",
      "اكتب كلمة إنجليزية بحروف إنجليزية فقط، من غير أرقام أو رموز",
      400,
    );
  }

  // ── 3. الكاش — الطريق السريع ─────────────────────────────
  const { data: cached } = await admin
    .from("dictionary_entries")
    .select("*")
    .eq("lemma_norm", word)
    .maybeSingle();

  if (cached) {
    if (cached.is_flagged) {
      return fail("flagged", "الكلمة دي مش متاحة حاليًا", 422);
    }
    let userWordId: string | null = null;
    if (body.add) {
      const { data } = await userClient.rpc("add_word", { p_entry_id: cached.id });
      userWordId = data?.user_word_id ?? null;
    }
    return json({ entry: cached, cached: true, user_word_id: userWordId });
  }

  // ── 4. حد الاستخدام اليومي ───────────────────────────────
  if (!GEMINI_KEY) {
    return fail("misconfigured", "خدمة الترجمة مش مضبوطة. جرّب بعدين", 503);
  }

  const { data: usage, error: usageErr } = await admin.rpc("bump_ai_usage", {
    p_user: user.id,
    p_limit: DAILY_LIMIT,
  });

  if (usageErr) {
    console.error("bump_ai_usage failed", usageErr);
    return fail("server_error", "حصل خطأ. جرّب تاني", 500);
  }
  if (!usage?.allowed) {
    return fail(
      "rate_limited",
      `وصلت لحد ${DAILY_LIMIT} كلمة جديدة النهاردة. تقدر تكمل بكرة، ومراجعة كلماتك شغالة عادي`,
      429,
    );
  }

  // ── 5. مستوى المستخدم ────────────────────────────────────
  const { data: profile } = await admin
    .from("profiles")
    .select("cefr_level")
    .eq("id", user.id)
    .maybeSingle();

  // ── 6. Gemini + النطق بالتوازي ───────────────────────────
  const [ai, audio] = await Promise.all([
    callGemini(GEMINI_KEY, word, profile?.cefr_level ?? "A2"),
    fetchAudio(word),
  ]);

  if (!ai.ok) {
    await admin.rpc("refund_ai_usage", { p_user: user.id });
    console.error("gemini failed:", ai.reason);
    if (ai.status === 429) {
      return fail("ai_busy", "الخدمة مزدحمة دلوقتي. جرّب بعد دقيقة", 429);
    }
    return fail("ai_failed", "ما قدرناش نجيب الكلمة دي. جرّب تاني", 502);
  }

  if (!ai.data.is_valid_word || ai.data.senses.length === 0) {
    await admin.rpc("refund_ai_usage", { p_user: user.id });
    // Spelling help costs nothing extra — the model already guessed for us.
    return json(
      {
        error: "not_a_word",
        message_ar: "ما لقيناش الكلمة دي في الإنجليزي. اتأكد من الإملاء",
        did_you_mean: ai.data.did_you_mean ?? [],
      },
      404,
    );
  }

  // ── 7. الحفظ في القاموس المشترك ──────────────────────────
  const row = {
    lemma: ai.data.lemma.trim() || word,
    lemma_norm: word,
    ipa: audio.ipa || ai.data.ipa || null,
    audio_url: audio.audio || null,
    cefr_level: ai.data.cefr_level ?? null,
    senses: ai.data.senses,
    examples: ai.data.examples,
    synonyms: ai.data.synonyms,
    antonyms: ai.data.antonyms,
    collocations: ai.data.collocations,
    confusable_with: ai.data.confusable_with,
    memory_tip_ar: ai.data.memory_tip_ar || null,
    source: "gemini",
    model_version: MODEL,
  };

  const { data: entry, error: insertErr } = await admin
    .from("dictionary_entries")
    .upsert(row, { onConflict: "lemma_norm" })
    .select("*")
    .single();

  if (insertErr || !entry) {
    console.error("insert failed", insertErr);
    return fail("server_error", "ما قدرناش نحفظ الكلمة. جرّب تاني", 500);
  }

  // ── 7b. بنك الأسئلة — يُولَّد مع الكلمة في نفس النداء ──────
  const questions = sanitizeQuestions(ai.data.questions ?? [], entry.lemma);
  if (questions.length > 0) {
    const { error: qErr } = await admin.from("entry_questions").upsert(
      questions.map((q) => ({
        entry_id: entry.id,
        kind: q.kind,
        difficulty: q.difficulty,
        prompt: q.prompt,
        prompt_hint: q.prompt_hint || null,
        answer: q.answer,
        distractors: q.distractors,
        explanation_ar: q.explanation_ar || null,
        source: "gemini",
      })),
      { onConflict: "entry_id,kind,prompt", ignoreDuplicates: true },
    );
    if (qErr) console.error("questions insert failed", qErr);
  }

  // ── 8. إضافتها لمكتبة المستخدم (اختياري) ─────────────────
  let userWordId: string | null = null;
  if (body.add) {
    const { data } = await userClient.rpc("add_word", { p_entry_id: entry.id });
    userWordId = data?.user_word_id ?? null;
  }

  return json({
    entry,
    cached: false,
    user_word_id: userWordId,
    ai_remaining: usage.remaining,
    questions_generated: questions.length,
  });
});
