import type { DictionaryEntry } from "@/lib/database.types";

/**
 * A single-word exam that can't be passed by knowing which word it is.
 *
 * The old quiz served the same multiple-choice questions the review session
 * uses. Those measure *recognition* — "which of these four is rent?" — and on
 * a screen you reached by tapping the word "rent", the answer arrives with the
 * question. Every card was free.
 *
 * So nothing here offers the word as an option. Four of the five ask you to
 * produce it from memory and spell it; the fifth asks what it means among
 * words that are deliberately close. Knowing you are being tested on "rent"
 * helps with none of them.
 *
 * Everything is built from the entry the app already has — the Arabic sense,
 * the real example sentences, the synonyms and antonyms — so an exam costs no
 * network call and works with the plane door shut.
 */
export type ExamStep =
  | {
      kind: "recall" | "definition" | "listening" | "usage";
      /** what the learner is shown; for `listening` the word is spoken instead */
      prompt: string;
      /** typed, compared leniently */
      answer: string;
      hint?: string;
    }
  | {
      kind: "meaning";
      prompt: string;
      answer: string;
      /** already shuffled; the right one is not marked */
      options: string[];
      hint?: string;
    };

/** The blank a usage question leaves behind. */
export const BLANK = "____";

/**
 * Case, surrounding space and trailing punctuation don't count — mirrors the
 * comparison submit_quiz_answer uses on the server so a word graded here and
 * a word graded there agree.
 */
export function sameAnswer(a: string, b: string): boolean {
  const clean = (x: string) =>
    x
      .trim()
      .toLowerCase()
      .replace(/^[\s.!?,;:"'()]+|[\s.!?,;:"'()]+$/g, "");
  return clean(a) === clean(b) && clean(a).length > 0;
}

/** Case-insensitively blank every occurrence of the word in a sentence. */
function blankOut(sentence: string, lemma: string): string | null {
  const re = new RegExp(
    "\\b" + lemma.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\w*",
    "gi",
  );
  if (!re.test(sentence)) return null;
  return sentence.replace(re, BLANK);
}

function shuffle<T>(xs: T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function buildExam(
  entry: DictionaryEntry,
  /** the learner's own correction, if they made one */
  override?: string | null,
): ExamStep[] {
  const lemma = entry.lemma.trim();
  const sense = entry.senses[0];
  const arabic =
    override?.trim() || sense?.ar_translations.filter(Boolean).join(" · ") || "";

  const steps: ExamStep[] = [];

  // 1 — produce the word from its meaning. The core of knowing a word.
  if (arabic) {
    steps.push({
      kind: "recall",
      prompt: arabic,
      answer: lemma,
      hint: sense?.pos,
    });
  }

  // 2 — the word in a real sentence, with the word taken out.
  for (const ex of entry.examples) {
    const blanked = ex.en ? blankOut(ex.en, lemma) : null;
    if (blanked) {
      steps.push({
        kind: "usage",
        prompt: blanked,
        answer: lemma,
        hint: ex.ar || undefined,
      });
      break;
    }
  }

  // 3 — hear it, spell it.
  steps.push({ kind: "listening", prompt: lemma, answer: lemma });

  // 4 — the English definition, without the word in it.
  const def = sense?.en_definition?.trim();
  if (def && !new RegExp("\\b" + lemma + "\\b", "i").test(def)) {
    steps.push({ kind: "definition", prompt: def, answer: lemma });
  }

  /**
   * 5 — the only question with options, and the only one about meaning.
   *
   * A synonym against this word's own antonyms is a real discrimination: the
   * options are all plausible English words, and knowing the prompt is "rent"
   * tells you nothing about which of them means the same.
   */
  const syn = entry.synonyms.filter(Boolean);
  const wrong = [...entry.antonyms, ...entry.confusable_with].filter(Boolean);
  if (syn.length > 0 && wrong.length >= 2) {
    const answer = syn[0]!;
    steps.push({
      kind: "meaning",
      prompt: lemma,
      answer,
      options: shuffle([answer, ...wrong.slice(0, 3)]),
    });
  }

  return steps;
}
