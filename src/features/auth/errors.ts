type Translate = (key: string, opts?: Record<string, unknown>) => string;

/**
 * Supabase returns technical English. Map it to a key so the message follows
 * whatever language the user picked.
 */
export function authErrorKey(message?: string): string {
  const m = (message ?? "").toLowerCase();

  if (m.includes("invalid login credentials")) return "errors.wrongCredentials";
  if (m.includes("email not confirmed")) return "errors.emailNotConfirmed";
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "errors.emailTaken";
  }
  if (m.includes("password should be at least")) return "errors.shortPassword";
  if (m.includes("pwned") || m.includes("compromised") || m.includes("weak")) {
    return "errors.weakPassword";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "errors.invalidEmail";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "errors.tooManyAttempts";
  }
  if (m.includes("network") || m.includes("fetch") || m.includes("timeout")) {
    return "errors.network";
  }
  if (m.includes("expired") || m.includes("invalid token")) {
    return "auth.linkExpired";
  }
  return "errors.generic";
}

export function authErrorAr(message?: string): string {
  // legacy helper kept for callers that don't have `t` handy
  return authErrorKey(message);
}

// ── field validation ──────────────────────────────────────

export function validateEmail(v: string, t: Translate): string | null {
  const s = v.trim();
  if (!s) return t("errors.emptyEmail");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return t("errors.invalidEmail");
  return null;
}

export function validatePassword(v: string, t: Translate): string | null {
  if (!v) return t("errors.emptyPassword");
  if (v.length < 8) return t("errors.shortPassword");
  return null;
}

export function validateName(v: string, t: Translate): string | null {
  const s = v.trim();
  if (s.length < 2) return t("errors.emptyName");
  if (s.length > 40) return t("errors.longName");
  return null;
}

/** 0–4, drives the strength meter on sign-up. */
export function passwordStrength(v: string): number {
  let score = 0;
  if (v.length >= 8) score += 1;
  if (v.length >= 12) score += 1;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 1;
  if (/\d/.test(v)) score += 1;
  if (/[^A-Za-z0-9]/.test(v)) score += 1;
  return Math.min(4, score);
}
