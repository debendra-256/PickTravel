import { APP_CONFIG } from "../config/app.config";
import { beginRequest } from "./requestTracker";

const POSTGRES_API_URL = (import.meta.env.VITE_API_BASE_URL || "https://vfncryzbhnhpivwszswy.supabase.co/functions/v1/picktravel").replace(/\/$/, "");
const SHEETS_API_URL = (import.meta.env.VITE_SHEETS_API_URL || "").replace(/\/$/, "");

const sheetsBackendEnabled = () => APP_CONFIG.ACTIVE_DB_DRIVER === "GOOGLE_SHEETS";

export function getApiBaseUrl() {
  return sheetsBackendEnabled() ? SHEETS_API_URL : POSTGRES_API_URL;
}

export function getSheetsApiBaseUrl() {
  return SHEETS_API_URL;
}

export async function apiRequest(path, options = {}) {
  // Background cache refreshes pass `silent` so they never block the page behind
  // the global spinner; only user-initiated actions are tracked.
  const finishRequest = options.silent ? null : beginRequest();
  try {
    const token = sessionStorage.getItem("PATRA_TOKEN");
    const headers = new Headers(options.headers || {});
    const method = (options.method || "GET").toUpperCase();
    let url;

    if (sheetsBackendEnabled()) {
      // Apps Script web apps only accept CORS-simple requests: GET/POST with text/plain
      // bodies and no custom headers. The API path and token therefore ride as query
      // parameters, and PATCH/DELETE are tunneled through POST via the _method override.
      if (!SHEETS_API_URL) throw new Error("VITE_SHEETS_API_URL is not configured for the Google Sheets database.");
      url = new URL(SHEETS_API_URL);
      url.searchParams.set("path", path);
      if (method !== "GET" && method !== "POST") {
        url.searchParams.set("_method", method);
      }
      if (token) url.searchParams.set("token", token);
      if (options.body !== undefined) headers.set("Content-Type", "text/plain;charset=utf-8");
    } else {
      url = `${POSTGRES_API_URL}${path}`;
      if (options.body !== undefined) headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const effectiveMethod = sheetsBackendEnabled() && method !== "GET" && method !== "POST" ? "POST" : method;
    const response = await fetch(url, { method: effectiveMethod, headers, body: options.body });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    // Apps Script cannot set HTTP status codes, so its errors arrive as 200 responses
    // with an { ok: false, message } envelope.
    if (!response.ok || payload?.ok === false) throw new Error(payload?.message || `Request failed (${response.status}).`);
    return payload;
  } finally {
    finishRequest?.();
  }
}
