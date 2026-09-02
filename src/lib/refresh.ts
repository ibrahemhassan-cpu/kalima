import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Pull-to-refresh that actually refreshes the whole screen.
 *
 * Invalidating a hand-written list of keys goes stale the moment a screen
 * gains one more query — Home alone reads the summary, the recent words, the
 * packs and the word of the day. `type: "active"` refetches exactly what the
 * mounted screens are subscribed to, so nothing is missed and nothing that
 * isn't on screen is fetched.
 *
 * `refetchQueries` resolves when the requests settle, so the spinner stays up
 * for as long as the work actually takes rather than a fixed guess.
 */
export function useRefreshAll() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await qc.refetchQueries({
        type: "active",
        /**
         * Everything except the word of the day.
         *
         * get_word_of_day only ever offers a word you don't own, so the moment
         * you add today's word a refetch answers with a different one — the
         * card swaps under you and the word you just added is no longer the
         * one the button opens. It is pinned to the day on the server; asking
         * again mid-day can only make it wrong.
         */
        predicate: (q) => q.queryKey[0] !== "word-of-day",
      });
    } finally {
      setRefreshing(false);
    }
  }, [qc]);

  return { refreshing, onRefresh };
}
