let activeRequests = 0;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getActiveRequestCount() {
  return activeRequests;
}

export function subscribeToRequests(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function beginRequest() {
  activeRequests += 1;
  notify();

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    activeRequests = Math.max(0, activeRequests - 1);
    notify();
  };
}
