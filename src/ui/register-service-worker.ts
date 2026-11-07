/**
 * Register the generated offline shell for the web build.
 *
 * Registration is production-only: `expo start` serves changing bundles that a
 * service worker would cache and serve stale. `expo export` sets
 * `NODE_ENV=production`, and the export pipeline generates `/sw.js`.
 */
export function registerProofPathServiceWorker(): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const register = (): void => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is an enhancement; a registration failure must not
      // break the online app.
    });
  };

  if (document.readyState === "complete") {
    register();
    return;
  }
  window.addEventListener("load", register, { once: true });
}
