import * as SQLite from "expo-sqlite";
import { supabase } from "./supabase";
import type { ReviewMode } from "./database.types";

/**
 * Offline review queue.
 *
 * Reviewing on the metro with no signal has to work — it's the single most
 * common moment people use a vocabulary app. Answers go into SQLite and are
 * replayed through `sync_reviews` the next time we're online.
 *
 * The server rebuilds SRS state from the review log, and every row carries a
 * `client_id`, so replaying twice is harmless.
 */

export type PendingReview = {
  client_id: string;
  user_word_id: string;
  rating: number;
  mode: ReviewMode;
  is_correct: boolean | null;
  ms_taken: number | null;
  reviewed_at: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db() {
  dbPromise ??= SQLite.openDatabaseAsync("kalima.db").then(async (d) => {
    await d.execAsync(`
      pragma journal_mode = WAL;
      create table if not exists pending_reviews (
        client_id    text primary key,
        user_word_id text not null,
        rating       integer not null,
        mode         text not null,
        is_correct   integer,
        ms_taken     integer,
        reviewed_at  text not null
      );
    `);
    return d;
  });
  return dbPromise;
}

export async function queueReview(r: PendingReview) {
  const d = await db();
  await d.runAsync(
    `insert or replace into pending_reviews
       (client_id, user_word_id, rating, mode, is_correct, ms_taken, reviewed_at)
     values (?, ?, ?, ?, ?, ?, ?)`,
    r.client_id,
    r.user_word_id,
    r.rating,
    r.mode,
    r.is_correct === null ? null : r.is_correct ? 1 : 0,
    r.ms_taken,
    r.reviewed_at,
  );
}

export async function pendingCount(): Promise<number> {
  const d = await db();
  const row = await d.getFirstAsync<{ n: number }>(
    "select count(*) as n from pending_reviews",
  );
  return row?.n ?? 0;
}

/**
 * Replays everything queued. Safe to call often — it no-ops when the queue is
 * empty and leaves rows in place if the network is still down.
 */
export async function flushQueue(): Promise<{ applied: number; skipped: number }> {
  const d = await db();
  const rows = await d.getAllAsync<{
    client_id: string;
    user_word_id: string;
    rating: number;
    mode: string;
    is_correct: number | null;
    ms_taken: number | null;
    reviewed_at: string;
  }>("select * from pending_reviews order by reviewed_at asc limit 200");

  if (rows.length === 0) return { applied: 0, skipped: 0 };

  const batch = rows.map((r) => ({
    client_id: r.client_id,
    user_word_id: r.user_word_id,
    rating: r.rating,
    mode: r.mode,
    is_correct: r.is_correct === null ? null : r.is_correct === 1,
    ms_taken: r.ms_taken,
  }));

  const { data, error } = await supabase.rpc("sync_reviews", { p_batch: batch });
  if (error) return { applied: 0, skipped: rows.length };

  // Only clear what we actually sent.
  const ids = rows.map((r) => `'${r.client_id.replace(/'/g, "''")}'`).join(",");
  await d.execAsync(`delete from pending_reviews where client_id in (${ids})`);

  const res = data as unknown as { applied: number; skipped: number } | null;
  return { applied: res?.applied ?? rows.length, skipped: res?.skipped ?? 0 };
}

export async function clearQueue() {
  const d = await db();
  await d.execAsync("delete from pending_reviews");
}
