// ═══════════════════════════════════════════════════════════
// Kalima — generate-questions
//
// يملأ بنك الأسئلة للكلمات التي أُضيفت قبل وجود البنك.
// التطبيق يناديها بهدوء في الخلفية عندما يجد كلمة ناضجة بلا أسئلة،
// فالمستخدم لا ينتظرها أبدًا.
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, fail, json } from "../_shared/cors.ts";
import { callGemini, MODEL, sanitizeQuestions } from "../enrich-word/gemini.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");

/** حد منفصل وأصغر — التوليد الخلفي يجب ألا يستهلك حصة الإضافة */
const BACKFILL_LIMIT = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return fail("method_not_allowed", "الطلب غير مدعوم", 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return fail("unauthenticated", "لازم تسجّل دخول الأول", 401);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData } = await userClient.auth.getUser();
  const user = userData?.user;
  if (!user) return fail("unauthenticated", "الجلسة انتهت", 401);
  if (!GEMINI_KEY) return fail("misconfigured", "الخدمة غير مضبوطة", 503);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  let body: { entry_id?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!body.entry_id) return fail("bad_request", "طلب غير صالح", 400);

  // موجودة خلاص؟ لا تنفق نداءً
  const { count } = await admin
    .from("entry_questions")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", body.entry_id);

  if ((count ?? 0) > 0) return json({ skipped: true, existing: count });

  const { data: entry } = await admin
    .from("dictionary_entries")
    .select("id, lemma, cefr_level")
    .eq("id", body.entry_id)
    .maybeSingle();

  if (!entry) return fail("not_found", "الكلمة غير موجودة", 404);

  const { data: usage, error: usageErr } = await admin.rpc("bump_ai_usage", {
    p_user: user.id,
    p_limit: BACKFILL_LIMIT,
  });
  if (usageErr || !usage?.allowed) {
    return json({ skipped: true, reason: "rate_limited" }, 200);
  }

  const ai = await callGemini(GEMINI_KEY, entry.lemma, entry.cefr_level ?? "A2");
  if (!ai.ok) {
    await admin.rpc("refund_ai_usage", { p_user: user.id });
    console.error("gemini failed:", ai.reason);
    return fail("ai_failed", "تعذّر التوليد", 502);
  }

  const questions = sanitizeQuestions(ai.data.questions ?? [], entry.lemma);
  if (questions.length === 0) {
    await admin.rpc("refund_ai_usage", { p_user: user.id });
    return json({ generated: 0 });
  }

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
  if (qErr) {
    console.error("insert failed", qErr);
    return fail("server_error", "تعذّر الحفظ", 500);
  }

  return json({ generated: questions.length, model: MODEL });
});
