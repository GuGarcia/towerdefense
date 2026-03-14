/**
 * Génération et lecture du lien de configuration partagée (seed + params).
 * ROADMAP_V4_MENU §6.1, §6.2
 */

const CONFIG_QUERY = "config";

export function buildShareConfigUrl(params: Record<string, unknown>): string {
  const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(params))));
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?${CONFIG_QUERY}=${encodeURIComponent(base64)}`;
}

export function getSharedConfigFromUrl(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(CONFIG_QUERY);
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(decoded) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function clearSharedConfigFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete(CONFIG_QUERY);
  window.history.replaceState({}, "", url.pathname + url.search);
}
