import { isOnline } from "./network";

type Translate = (key: string) => string;

/**
 * A message worth putting on screen when an action fails.
 *
 * "Something went wrong" is honest and useless: a restore was failing on a
 * Postgres type error for a whole round of testing and the screen said only
 * that. In development the real message comes through, so the next failure is
 * diagnosable from the device instead of from guesswork.
 *
 * Release builds keep the plain wording — a user has no use for
 * "COALESCE types word_status and text cannot be matched".
 */
export function actionError(e: unknown, t: Translate): string {
  if (!isOnline()) return t("errors.network");

  const generic = t("errors.generic");
  if (!__DEV__) return generic;

  const raw =
    typeof e === "object" && e !== null && "message" in e
      ? String((e as { message?: unknown }).message ?? "")
      : "";

  return raw.trim() ? generic + " — " + raw.trim() : generic;
}
