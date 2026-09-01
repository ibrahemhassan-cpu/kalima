import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

/**
 * The cache that survives closing the app.
 *
 * Opening Kalima on the metro with no signal must show your words, your
 * progress and your packs — not a spinner. Every successful query is written
 * to disk and read back on the next launch, so the first paint is real data
 * even before a single request goes out.
 *
 * Only what the server returned is kept: no images, no audio, a few hundred
 * kilobytes of text at most.
 */

const CACHE_KEY = "kalima-query-cache";

/** A week. Older than that and we'd rather show nothing than something wrong. */
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Long, because this is also the offline window. The old 60s default
       * garbage-collected everything five minutes after you closed a screen,
       * which left nothing on disk to restore.
       */
      gcTime: CACHE_MAX_AGE,
      staleTime: 60_000,
      /**
       * Show the cached answer immediately, then refresh behind it. Without
       * this, a query with no network sits pending forever and the screen
       * shows a spinner over data we already have.
       */
      networkMode: "offlineFirst",
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // a review submitted offline should fail fast so the local queue takes it
      networkMode: "offlineFirst",
    },
  },
});

/**
 * Query keys whose first element is here are never written to disk.
 *
 * Each is keyed by whatever the user typed, so they multiply without limit —
 * one entry per prefix of every search, kept for the whole gcTime window. On
 * Android AsyncStorage tops out around 6MB, and once a write fails the
 * persister stops saving silently, taking offline support down with it. They
 * are also the cheapest things to refetch, so losing them costs nothing.
 */
const VOLATILE_KEYS = new Set([
  "dict-search",
  "lookup-words",
  // today's AI allowance: restoring yesterday's count states a number that
  // is confidently wrong, and it costs one cheap call to ask again
  "ai-quota",
  // keyed per dictionary entry, so it grows with every synonym tapped and
  // is null for almost all of them. The screens that read it need the
  // network anyway, so persisting buys nothing.
  "custom-translation",
]);

/** True for a query worth carrying to the next launch. */
export function shouldPersist(queryKey: readonly unknown[]): boolean {
  const [head, , search] = queryKey as [string, unknown, unknown];
  if (VOLATILE_KEYS.has(head)) return false;
  // "my-words" without a search term is the library itself; with one it's a query
  if (head === "my-words" && typeof search === "string" && search.length > 0) {
    return false;
  }
  return true;
}

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  // batch writes; the cache changes on every keystroke in search otherwise
  throttleTime: 2_000,
});

/**
 * Wipes both the live cache and the copy on disk.
 *
 * Called on sign-out. Clearing only the in-memory client would leave the
 * previous account's words on disk for the next person who signs in on this
 * phone — the cache is convenience, never a leak.
 */
export async function purgeCache() {
  queryClient.clear();
  await persister.removeClient();
}
