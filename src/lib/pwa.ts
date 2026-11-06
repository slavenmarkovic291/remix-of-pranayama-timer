/** The only place the offline service worker is registered. Never in dev or previews. */
const SW_URL = "/sw.js";

function refused(): boolean {
  if (!import.meta.env.PROD) return true;
  try { if (window.self !== window.top) return true; } catch { return true; }
  const h = window.location.hostname.toLowerCase();
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  const label = h.split(".")[0] ?? "";
  const lovableHost = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(h);
  if (lovableHost && /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label)) return true;
  if (lovableHost && /^project--.+-dev$/.test(label)) return true;
  if (h === "id-preview--4aa3c292-b40e-494b-b8f8-4a2ad6abfe2e.lovable.app") return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  return false;
}

export async function registerOfflineWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (refused()) {
    const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
    await Promise.all(
      regs.filter((r) => r.active?.scriptURL.endsWith(SW_URL)).map((r) => r.unregister()),
    );
    return;
  }
  navigator.serviceWorker.register(SW_URL).catch(() => {});
}
