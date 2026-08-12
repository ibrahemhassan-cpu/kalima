/**
 * رسائل Supabase بتيجي بالإنجليزي وتقنية.
 * بنحوّلها لرسائل عربية يفهمها أي حد.
 */
export function authErrorAr(message?: string): string {
  const m = (message ?? "").toLowerCase();

  if (m.includes("invalid login credentials")) return "الإيميل أو كلمة المرور غلط";
  if (m.includes("email not confirmed")) {
    return "لازم تفعّل الإيميل الأول. بصّ في بريدك (وفي spam كمان)";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "الإيميل ده مسجّل قبل كده. جرّب تسجّل دخول";
  }
  if (m.includes("password should be at least")) {
    return "كلمة المرور قصيرة — لازم 8 حروف على الأقل";
  }
  if (m.includes("pwned") || m.includes("compromised") || m.includes("weak")) {
    return "كلمة المرور دي مسرّبة في اختراقات سابقة. اختار واحدة تانية";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "الإيميل مش مكتوب صح";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "محاولات كتير. استنى شوية وجرّب تاني";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "مفيش اتصال بالإنترنت";
  }
  if (m.includes("same password")) {
    return "كلمة المرور الجديدة زي القديمة";
  }

  return "حصل خطأ. جرّب تاني";
}

export function validateEmail(v: string): string | null {
  const t = v.trim();
  if (!t) return "اكتب الإيميل";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return "الإيميل مش مكتوب صح";
  return null;
}

export function validatePassword(v: string): string | null {
  if (!v) return "اكتب كلمة المرور";
  if (v.length < 8) return "لازم 8 حروف على الأقل";
  return null;
}

export function validateName(v: string): string | null {
  const t = v.trim();
  if (t.length < 2) return "اكتب اسمك";
  if (t.length > 40) return "الاسم طويل أوي";
  return null;
}
