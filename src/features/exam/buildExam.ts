import type { DictionaryEntry } from "@/lib/database.types";

/**
 * A short exam for one word: mostly recognition, one production question.
 *
 * Two forces pull against each other here. The old quiz reused the review
 * session's cards, where the answer *is* the word — and on a screen you
 * reached by tapping "rent", "which of these is rent?" answers itself. The
 * first rewrite fixed that by making everything typed, which measured spelling
 * more than knowing, and four keyboard questions in a row is a chore.
 *
 * So: three or four questions, ramping. The one question that can't be guessed
 * from knowing which word you are on comes first — picking the closest meaning
 * from that word's own synonyms and antonyms. Then usage, which reinforces
 * even when the answer is inferable. Then one typed recall at the end, with
 * the first letter and the length shown so it is a memory test rather than a
 * spelling trap.
 *
 * All of it is built from the entry the app already holds, so an exam needs no
 * network call and works offline.
 */
export type ExamStep = {
  kind: "closest" | "usage" | "listening" | "spell";
  /** what the learner is shown; for `listening` the word is spoken instead */
  prompt: string;
  answer: string;
  /** present on choice questions; already shuffled, the answer unmarked */
  options?: string[];
  /** a sentence translation, part of speech, or the letter pattern */
  hint?: string;
};

export const BLANK = "____";

/**
 * Case, surrounding space and edge punctuation don't count — the same
 * leniency submit_quiz_answer applies on the server, so a word judged here
 * and a word judged there agree.
 */
export function sameAnswer(a: string, b: string): boolean {
  const clean = (x: string) =>
    x
      .trim()
      .toLowerCase()
      .replace(/^[\s.!?,;:"'()]+|[\s.!?,;:"'()]+$/g, "");
  return clean(a) === clean(b) && clean(a).length > 0;
}

/** "rent" → "r · · ·" — enough to jog the memory, not enough to give it. */
export function letterHint(word: string): string {
  const w = word.trim();
  if (w.length < 2) return w;
  return w[0] + " " + Array(w.length - 1).fill("·").join(" ");
}

function blankOut(sentence: string, lemma: string): string | null {
  const re = new RegExp(
    "\\b" + lemma.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\w*",
    "gi",
  );
  return re.test(sentence) ? sentence.replace(re, BLANK) : null;
}

function shuffle<T>(xs: T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Distinct, non-empty, and never the word itself. */
function pool(lemma: string, ...groups: string[][]): string[] {
  const seen = new Set([lemma.trim().toLowerCase()]);
  const out: string[] = [];
  for (const g of groups) {
    for (const raw of g) {
      const v = raw?.trim();
      if (!v) continue;
      const k = v.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(v);
    }
  }
  return out;
}

export function buildExam(
  entry: DictionaryEntry,
  override?: string | null,
): ExamStep[] {
  const lemma = entry.lemma.trim();
  const sense = entry.senses[0];
  const arabic =
    override?.trim() || sense?.ar_translations.filter(Boolean).join(" · ") || "";

  const steps: ExamStep[] = [];

  /**
   * 1 — the only question knowing the word doesn't answer.
   *
   * The options are all ordinary English words drawn from this entry, so
   * "which is closest to rent?" genuinely asks whether you know what rent
   * means, not which word is on the screen.
   */
  const syn = pool(lemma, entry.synonyms);
  const notSyn = pool(lemma, entry.antonyms, entry.confusable_with);
  if (syn.length > 0 && notSyn.length >= 2) {
    const answer = syn[0]!;
    steps.push({
      kind: "closest",
      prompt: lemma,
      answer,
      options: shuffle([answer, ...notSyn.slice(0, 3)]),
    });
  }

  // 2 — the word in a real sentence, chosen against words that nearly fit
  const distractors = pool(lemma, entry.confusable_with, entry.synonyms, entry.antonyms);
  for (const ex of entry.examples) {
    const blanked = ex.en ? blankOut(ex.en, lemma) : null;
    if (!blanked) continue;
    if (distractors.length >= 2) {
      steps.push({
        kind: "usage",
        prompt: blanked,
        answer: lemma,
        options: shuffle([lemma, ...distractors.slice(0, 3)]),
        hint: ex.ar || undefined,
      });
    }
    break;
  }

  // 3 — hear it, pick the spelling. Only worth asking against look-alikes.
  const lookalikes = pool(lemma, entry.confusable_with);
  if (lookalikes.length >= 2) {
    steps.push({
      kind: "listening",
      prompt: lemma,
      answer: lemma,
      options: shuffle([lemma, ...lookalikes.slice(0, 3)]),
    });
  }

  /**
   * 4 — the one typed question, and the only real production test.
   *
   * The letter pattern is deliberate: without it this is a spelling exam, and
   * a learner who knows exactly what the word means still fails it.
   */
  if (arabic) {
    steps.push({
      kind: "spell",
      prompt: arabic,
      answer: lemma,
      hint: letterHint(lemma),
    });
  }

  return steps;
}
