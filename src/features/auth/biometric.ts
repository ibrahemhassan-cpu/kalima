import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/store/settings";

/**
 * Quick sign-in with a fingerprint.
 *
 * A fingerprint proves nothing to a server — it only unlocks the device. So the
 * flow is: the user signs in with a password once, we keep that session's
 * **refresh token**, and tapping the fingerprint exchanges it for a fresh
 * session. The password itself is never stored: a stored password can be read
 * back, a refresh token can be revoked server-side.
 */
const KEY = "kalima-quick-token";

/**
 * Stored without SecureStore's `requireAuthentication`, deliberately.
 *
 * On Android that flag gates *writing* too — expo-secure-store authenticates
 * the cipher before encrypting — so every background session refresh would pop
 * a fingerprint prompt out of nowhere. And it would buy nothing: the live
 * session, refresh token included, already sits in this same keychain
 * unprotected. So the keychain holds the token and `LocalAuthentication` guards
 * the act of using it, which is exactly the app's existing security model.
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, token);
  } catch {
    // storage full or keychain locked — quick sign-in simply won't be offered
  }
}

/** Does this device have a fingerprint (or face) actually enrolled? */
export async function biometricAvailable(): Promise<boolean> {
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

/** What the device calls it, so the button says the right word. */
export async function biometricLabel(): Promise<"face" | "fingerprint"> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    )
      ? "face"
      : "fingerprint";
  } catch {
    return "fingerprint";
  }
}

/**
 * Turns it on: prove the biometric works first, then keep the token. Asking up
 * front means a user who can't complete the scan never ends up with quick
 * sign-in switched on but broken.
 */
export async function enableQuickLogin(prompt: string): Promise<boolean> {
  if (!(await biometricAvailable())) return false;

  const check = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
  });
  if (!check.success) return false;

  const { data } = await supabase.auth.getSession();
  const token = data.session?.refresh_token;
  if (!token) return false;

  await saveToken(token);
  return true;
}

export type QuickResult =
  | { ok: true }
  /** the user backed out of the prompt — deliberate, say nothing */
  | { ok: false; reason: "cancelled" }
  /** nothing stored on this device */
  | { ok: false; reason: "missing" }
  /** revoked or expired — only a password gets them back in */
  | { ok: false; reason: "expired" };

export async function quickSignIn(prompt: string): Promise<QuickResult> {
  const check = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
  });
  if (!check.success) return { ok: false, reason: "cancelled" };

  const token = await SecureStore.getItemAsync(KEY).catch(() => null);
  if (!token) return { ok: false, reason: "missing" };

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: token,
  });
  if (error || !data.session) return { ok: false, reason: "expired" };

  // Supabase rotates on use, so the token we just spent is already dead.
  await saveToken(data.session.refresh_token);
  return { ok: true };
}

export async function clearQuickLogin(): Promise<void> {
  useSettings.getState().setQuickLogin(false);
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // never stored
  }
}
