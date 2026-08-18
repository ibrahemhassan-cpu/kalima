#!/usr/bin/env node
/**
 * Pre-generates the shared dictionary.
 *
 * Why bother: the very first user to look up a word waits 3–6 seconds for
 * Gemini. Every user after that gets it instantly from the cache. Seeding the
 * few thousand words people actually look up means almost nobody ever waits.
 *
 * Usage:
 *   node scripts/seed-dictionary.mjs scripts/words-core.txt
 *   node scripts/seed-dictionary.mjs list.txt --limit 200 --delay 7000
 *
 * Requires a signed-in user; the script logs in with a throwaway account you
 * control, because enrich-word is behind auth on purpose.
 *
 * Environment (.env.seed or shell):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SEED_EMAIL, SEED_PASSWORD
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ── config ────────────────────────────────────────────────
const args = process.argv.slice(2);
const listPath = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback;
};

const LIMIT = flag("limit", Infinity);
/** Gemini's free tier is roughly 10 requests/minute — stay comfortably under. */
const DELAY_MS = flag("delay", 7000);
const PROGRESS_FILE = ".seed-progress.json";

/** How long to wait each time Gemini throttles us, in order. */
const BACKOFF = [60_000, 150_000, 300_000];
/** After this many throttles on one word, give up on it and move on. */
const MAX_WAITS = BACKOFF.length;
/**
 * If this many words in a row are throttled to death, the quota is gone for
 * the day — keep waiting and you'll burn hours for nothing. Stop and say so.
 */
const QUOTA_GIVE_UP = 3;

loadEnvFile(".env.seed");

const URL_BASE = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const EMAIL = process.env.SEED_EMAIL;
const PASSWORD = process.env.SEED_PASSWORD;

if (!URL_BASE || !ANON || !EMAIL || !PASSWORD) {
  console.error(
    "Missing config. Create .env.seed with:\n" +
      "  SUPABASE_URL=...\n  SUPABASE_ANON_KEY=...\n" +
      "  SEED_EMAIL=...\n  SEED_PASSWORD=...",
  );
  process.exit(1);
}
if (!listPath || !fs.existsSync(listPath)) {
  console.error("Give me a word list: node scripts/seed-dictionary.mjs words.txt");
  process.exit(1);
}

// ── helpers ───────────────────────────────────────────────
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadProgress() {
  try {
    return new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8")));
  } catch {
    return new Set();
  }
}
function saveProgress(done) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify([...done], null, 0));
}

async function signIn() {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`sign-in failed: ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  return body.access_token;
}

async function enrich(token, word) {
  const res = await fetch(`${URL_BASE}/functions/v1/enrich-word`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ word }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

// ── run ───────────────────────────────────────────────────
const words = [
  ...new Set(
    fs
      .readFileSync(listPath, "utf8")
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter((w) => /^[a-z][a-z '-]{1,40}$/.test(w)),
  ),
];

const done = loadProgress();
const todo = words.filter((w) => !done.has(w)).slice(0, LIMIT);

console.log(
  `${words.length} words in list · ${done.size} already done · ${todo.length} to go`,
);
if (todo.length === 0) process.exit(0);

let token = await signIn();
let cached = 0;
let generated = 0;
let failed = 0;
/** words in a row that ran out of backoff — the signal that the quota is gone */
let throttledInARow = 0;
/** raised whenever Gemini throttles, so the whole run eases off, not just one word */
let pace = DELAY_MS;
let stoppedEarly = false;
const startedAt = Date.now();

for (const [i, word] of todo.entries()) {
  let attempt = 0; // real errors
  let waits = 0; // Gemini throttles
  let ok = false;
  let wasCached = false;
  let quotaGone = false;

  while (!ok && attempt < 3 && waits < MAX_WAITS) {
    const { status, body } = await enrich(token, word);

    if (status === 401) {
      token = await signIn(); // token expired mid-run
      continue;
    }

    if (status === 429) {
      /**
       * Two very different things arrive as 429:
       *   rate_limited → our own AI_DAILY_LIMIT. Waiting can't help.
       *   ai_busy      → Gemini is throttling. Waiting is exactly right.
       */
      if (body?.error === "rate_limited") {
        console.log(`\n  ✗ ${body.message_ar ?? "daily limit reached"}`);
        console.log(
          "  ارفع AI_DAILY_LIMIT وأعد نشر enrich-word، ثم شغّل السكربت تاني.",
        );
        quotaGone = true;
        break;
      }

      waits += 1;
      const wait = BACKOFF[Math.min(waits - 1, BACKOFF.length - 1)];
      console.log(
        `  ${word} — Gemini throttled (${waits}/${MAX_WAITS}) · waiting ${wait / 1000}s`,
      );
      await sleep(wait);
      pace = Math.min(pace + 3000, 30_000); // slow the whole run down
      continue;
    }

    if (status === 404) {
      console.log(`  ✗ ${word} — not a word`);
      done.add(word);
      ok = true;
      break;
    }

    if (status >= 200 && status < 300) {
      wasCached = !!body.cached;
      if (wasCached) cached += 1;
      else generated += 1;
      done.add(word);
      ok = true;
      break;
    }

    attempt += 1;
    console.log(`  ! ${word} — ${status} ${body?.error ?? ""} (try ${attempt}/3)`);
    await sleep(3000);
  }

  if (!ok) {
    failed += 1;
    // only throttling counts toward "the quota is gone"; a bad word doesn't
    throttledInARow = waits >= MAX_WAITS || quotaGone ? throttledInARow + 1 : 0;

    if (quotaGone || throttledInARow >= QUOTA_GIVE_UP) {
      stoppedEarly = true;
      break;
    }
  } else {
    throttledInARow = 0;
  }

  const n = i + 1;
  if (n % 10 === 0 || n === todo.length) {
    const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
    const rate = n / Math.max(1, (Date.now() - startedAt) / 60000);
    const left = ((todo.length - n) / Math.max(rate, 0.1)).toFixed(0);
    console.log(
      `[${n}/${todo.length}] generated ${generated} · cached ${cached} · failed ${failed} · ${mins}m elapsed · ~${left}m left`,
    );
    saveProgress(done);
  }

  // A cache hit cost nothing, so there's nothing to pace.
  await sleep(wasCached ? 200 : pace);
}

saveProgress(done);

if (stoppedEarly) {
  console.log(
    `\nوقفت بدري — Gemini رافضة الطلبات باستمرار.\n` +
      `غالبًا حصتك اليومية خلصت (الطبقة المجانية محدودة بعدد طلبات في اليوم).\n\n` +
      `اتأكد من السبب الحقيقي هنا:\n` +
      `  Supabase Dashboard → Edge Functions → enrich-word → Logs\n` +
      `  دوّر على سطر "gemini failed: gemini 429" — الرسالة جوّاه بتفرّق\n` +
      `  بين PerMinute (استنى شوية) و PerDay (استنى بكرة).\n\n` +
      `اللي اتعمل لحد دلوقتي محفوظ. شغّل نفس الأمر تاني وهيكمّل من مكانه.`,
  );
}

console.log(
  `\nDone. generated ${generated} · cached ${cached} · failed ${failed}\n` +
    `Progress saved to ${path.resolve(PROGRESS_FILE)} — rerun any time to continue.`,
);
