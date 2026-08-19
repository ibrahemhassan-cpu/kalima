import { useSyncExternalStore } from "react";
import * as Network from "expo-network";
import { onlineManager } from "@tanstack/react-query";

/**
 * One source of truth for "are we online".
 *
 * React Query keeps its own `onlineManager`, and on React Native it assumes
 * online forever unless something tells it otherwise. So we feed the device's
 * real state into it and read everything back out of the same place — the
 * banner, the screens and the query engine can never disagree.
 */

/** Treat "connected but the internet is unreachable" (captive wifi) as offline. */
function reachable(state: {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
}): boolean {
  if (state.isConnected === false) return false;
  // undefined means "not determined yet" — don't call that offline
  if (state.isInternetReachable === false) return false;
  return true;
}

/** Called once from the root layout. */
export function startNetworkWatch(): () => void {
  void Network.getNetworkStateAsync()
    .then((s) => onlineManager.setOnline(reachable(s)))
    .catch(() => onlineManager.setOnline(true));

  const sub = Network.addNetworkStateListener((state) => {
    onlineManager.setOnline(reachable(state));
  });

  return () => sub.remove();
}

/** Subscribes to the same manager React Query uses. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}

export function isOnline(): boolean {
  return onlineManager.isOnline();
}
