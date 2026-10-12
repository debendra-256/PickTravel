import { useSyncExternalStore } from "react";
import { getActiveRequestCount, subscribeToRequests } from "../dal/requestTracker";

export function GlobalSpinner() {
  const activeRequestCount = useSyncExternalStore(
    subscribeToRequests,
    getActiveRequestCount,
    () => 0
  );

  if (activeRequestCount === 0) return null;

  return (
    <div className="global-spinner-backdrop" role="status" aria-live="polite" aria-label="Loading">
      <div className="global-spinner" aria-hidden="true" />
      <span className="global-spinner-label">Please wait…</span>
    </div>
  );
}
