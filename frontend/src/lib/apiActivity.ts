const slowRequests = new Set<symbol>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const subscribeToApiActivity = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const hasSlowApiRequests = () => slowRequests.size > 0;

export const beginApiRequest = (delayMs = 10000) => {
  const id = Symbol();
  const timer = setTimeout(() => {
    slowRequests.add(id);
    notify();
  }, delayMs);
  return () => {
    clearTimeout(timer);
    if (slowRequests.delete(id)) notify();
  };
};
