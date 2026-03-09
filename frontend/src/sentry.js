// Lightweight sentry wrapper that lazy-loads the real Sentry SDK only when
// `initSentry` is called. This prevents bundling Sentry into the main chunk
// when a DSN is not configured or during development.

let _sentry = null;

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  // Only initialize in production and when a DSN is provided
  if (!dsn || import.meta.env.DEV) return;

  const Sentry = await import("@sentry/react");
  const { BrowserTracing } = await import("@sentry/tracing");

  Sentry.init({
    dsn,
    integrations: [new BrowserTracing()],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });

  _sentry = Sentry;
}

// Expose a small surface that other modules can import synchronously.
// Calls will be forwarded to the real Sentry if/when it's initialized.
function _callIfReady(fnName, ...args) {
  if (!_sentry) return undefined;
  const fn = _sentry[fnName];
  if (typeof fn === "function") return fn(...args);
  return undefined;
}

export function addBreadcrumb(...args) {
  return _callIfReady("addBreadcrumb", ...args);
}

export function captureException(...args) {
  return _callIfReady("captureException", ...args);
}

export default {
  initSentry,
  addBreadcrumb,
  captureException,
};
