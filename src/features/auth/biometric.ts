import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/store/settings";

/**
 * Quick sign-in with a fingerprint.
 *
 * A fingerprint proves nothing to a server — it only unlocks the device. So we
 * keep the credentials in the OS keychain (Keychain on iOS, Keystore on
 * Android) and the fingerprint guards using them: scan, read, sign in.
 *
 * The trade-off, stated plainly: a stored password cannot be revoked
 * server-side the way a token can. What it buys is that it never expires — a
 * refresh token rotates on every use and dies on sign-out, which made quick
 * sign-in fail exactly when the user needed it.
 */
const KEY = "kalima-quick-creds";

type Credentials = { email: string; password: string };

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

/** Is there anything stored to sign in with on this device? */
export async function hasStoredCredentials(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(KEY)) != null;
  } catch {
    return false;
  }
}

/**
 * Turns it on.
 *
 * The password is checked against the server before it is kept — storing one
 * that turns out to be wrong would leave the user with a fingerprint button
 * that fails forever with no way to tell why.
 */
export async function enableQuickLogin(
  creds: Credentials,
  prompt: string,
): Promise<{ ok: true } | { ok: false; reason: "biometric" | "password" }> {
  if (!(await biometricAvailable())) return { ok: false, reason: "biometric" };

  const check = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
  });
  if (!check.success) return { ok: false, reason: "biometric" };

  const { error } = await supabase.auth.signInWithPassword(creds);
  if (error) return { ok: false, reason: "password" };

  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(creds));
  } catch {
    return { ok: false, reason: "biometric" };
  }

  useSettings.getState().setQuickLogin(true);
  return { ok: true };
}

export type QuickResult =
  | { ok: true }
  /** the user backed out of the prompt — deliberate, say nothing */
  | { ok: false; reason: "cancelled" }
  /** nothing stored on this device */
  | { ok: false; reason: "missing" }
  /** the password changed elsewhere — only a fresh one gets them back in */
  | { ok: false; reason: "invalid" };

export async function quickSignIn(prompt: string): Promise<QuickResult> {
  const check = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    // let the user fall back to the device PIN if the sensor keeps refusing
    disableDeviceFallback: false,
  });
  if (!check.success) return { ok: false, reason: "cancelled" };

  const raw = await SecureStore.getItemAsync(KEY).catch(() => null);
  if (!raw) return { ok: false, reason: "missing" };

  let creds: Credentials;
  try {
    creds = JSON.parse(raw) as Credentials;
  } catch {
    return { ok: false, reason: "missing" };
  }

  const { error } = await supabase.auth.signInWithPassword(creds);
  if (error) return { ok: false, reason: "invalid" };

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
