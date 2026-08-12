export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** خطأ برسالة عربية للمستخدم وكود للتطبيق */
export function fail(code: string, messageAr: string, status = 400) {
  return json({ error: code, message_ar: messageAr }, status);
}
