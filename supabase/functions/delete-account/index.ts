// ═══════════════════════════════════════════════════════════
// Kalima — delete-account
//
// حذف كامل ونهائي للحساب. متطلب إلزامي من App Store منذ 2022،
// وغيابه سبب رفض شبه مؤكد.
//
// الحذف من auth.users بيجرّ معاه كل الجداول عبر ON DELETE CASCADE.
// مساهمات المستخدم في dictionary_entries بتفضل — دي بيانات مجهولة
// المصدر أصلًا ومش مربوطة بيه.
// ═══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, fail, json } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return fail("unauthenticated", "الجلسة انتهت، سجّل دخول تاني", 401);
  }

  // تأكيد صريح — المستخدم لازم يكتب كلمة "حذف"
  let body: { confirm?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.confirm !== "حذف" && body.confirm !== "DELETE") {
    return fail("confirm_required", "اكتب كلمة «حذف» للتأكيد", 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // سجل تدقيق قبل الحذف
  await admin.from("deletion_requests").upsert({
    user_id: user.id,
    email: user.email ?? null,
    requested_at: new Date().toISOString(),
  });

  // 1) صور البروفايل من التخزين
  try {
    const { data: files } = await admin.storage.from("avatars").list(user.id);
    if (files?.length) {
      await admin.storage
        .from("avatars")
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch (e) {
    console.error("avatar cleanup failed", e);
  }

  // 2) الحساب نفسه — الـ CASCADE بيحذف كل الجداول المرتبطة
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("deleteUser failed", delErr);
    return fail("delete_failed", "ما قدرناش نحذف الحساب. راسلنا من فضلك", 500);
  }

  await admin
    .from("deletion_requests")
    .update({ processed_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return json({ deleted: true });
});
