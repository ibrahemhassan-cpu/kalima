import * as Speech from "expo-speech";

/**
 * نطق الكلمات.
 *
 * الطبقة الأولى: expo-speech — مجاني، أوفلاين، على كل جهاز.
 * الطبقة الثانية (لاحقًا): ملف صوت بشري من audio_url لو متاح.
 *
 * السرعة 0.85 أبطأ من الافتراضي عمدًا — المتعلّم المبتدئ يحتاج وقت.
 */

export const RATE_NORMAL = 0.85;
export const RATE_SLOW = 0.55;

export function speak(text: string, opts?: { slow?: boolean }) {
  Speech.stop();
  Speech.speak(text, {
    language: "en-US",
    rate: opts?.slow ? RATE_SLOW : RATE_NORMAL,
    pitch: 1.0,
  });
}

export function stopSpeaking() {
  Speech.stop();
}

export async function isSpeaking() {
  return Speech.isSpeakingAsync();
}
