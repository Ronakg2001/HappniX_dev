/**
 * auth.js — Shared authentication utilities for HappniX frontend.
 *
 * Load this script BEFORE any other page script that makes API calls.
 * It exposes a global `HappniXAuth` object with all token management,
 * fetch wrappers, and logout logic so nothing is duplicated across pages.
 *
 * Usage in HTML:
 *   <script src="auth.js"></script>
 *
 * Usage in JS:
 *   const data = await HappniXAuth.getJson("/api/profile/me");
 *   const data = await HappniXAuth.postJson("/api/auth", { actionItem: "..." });
 *   HappniXAuth.logout();
 */

(function (global) {
  "use strict";

  // ── Token storage keys ──────────────────────────────────────────────────────
  const TOKEN_KEY    = "happnix_access_token";
  const REFRESH_KEY  = "happnix_refresh_token";
  const SESSION_KEY  = "happnix_session_id";
  const PREAUTH_KEY  = "happnix_preauth_token";
  const TAB_KEY      = "happnix_active_tab";

  // ── Token helpers ────────────────────────────────────────────────────────────
  function getAccessToken()  { return localStorage.getItem(TOKEN_KEY); }
  function getRefreshToken() { return localStorage.getItem(REFRESH_KEY); }
  function getSessionId()    { return localStorage.getItem(SESSION_KEY); }
  function getPreAuthToken() { return localStorage.getItem(PREAUTH_KEY); }

  function saveTokens({ accessToken, refreshToken, sessionId }) {
    if (accessToken)  localStorage.setItem(TOKEN_KEY,   accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (sessionId)    localStorage.setItem(SESSION_KEY, sessionId);
  }

  function savePreAuthToken(token) {
    if (token) localStorage.setItem(PREAUTH_KEY, token);
  }

  function clearPreAuthToken() {
    localStorage.removeItem(PREAUTH_KEY);
  }

  function clearAllTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PREAUTH_KEY);
    localStorage.removeItem(TAB_KEY);
  }

  function isLoggedIn() {
    return !!localStorage.getItem(REFRESH_KEY);
  }

  // ── API URL builder ──────────────────────────────────────────────────────────
  function apiUrl(path) {
    const cfg = window.HAPPNIX_RUNTIME_CONFIG || {};
    if (typeof cfg.buildApiUrl === "function") return cfg.buildApiUrl(path);
    const base = String(cfg.apiBaseUrl || "").replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return base ? `${base}${cleanPath}` : cleanPath;
  }

  // ── Silent token refresh ─────────────────────────────────────────────────────
  async function handleTokenRefresh() {
    const refreshToken = getRefreshToken();
    const sessionId    = getSessionId();

    // No credentials at all — never logged in, don't redirect
    if (!refreshToken || !sessionId) return false;

    try {
      const res = await fetch(apiUrl("/api/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ actionItem: "RefreshToken", refreshToken, sessionId })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.accessToken) {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        return true;
      }

      // Only force logout on explicit session-expired 401 from the refresh endpoint
      if (res.status === 401) {
        clearAllTokens();
        window.location.href = "/signup_signin.html";
        return false;
      }
    } catch (e) {
      // Network error — don't redirect, just fail silently
      console.error("[HappniXAuth] Silent refresh failed (network error)", e);
    }

    return false;
  }

  // ── Authorized fetch helpers ─────────────────────────────────────────────────

  function _authHeaders(extra = {}) {
    const headers = { ...extra };
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  async function getJson(url, isRetry = false) {
    const response = await fetch(apiUrl(url), {
      headers: _authHeaders(),
      credentials: "include"
    });
    if (response.status === 401 && !isRetry) {
      const refreshed = await handleTokenRefresh();
      if (refreshed) return getJson(url, true);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }

  async function postJson(url, payload, isRetry = false) {
    const response = await fetch(apiUrl(url), {
      method: "POST",
      headers: _authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    if (response.status === 401 && !isRetry) {
      const refreshed = await handleTokenRefresh();
      if (refreshed) return postJson(url, payload, true);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }

  async function postFormData(url, formData, isRetry = false) {
    const response = await fetch(apiUrl(url), {
      method: "POST",
      headers: _authHeaders(),
      credentials: "include",
      body: formData
    });
    if (response.status === 401 && !isRetry) {
      const refreshed = await handleTokenRefresh();
      if (refreshed) return postFormData(url, formData, true);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }

  async function deleteJson(url, body = null, isRetry = false) {
    const response = await fetch(apiUrl(url), {
      method: "DELETE",
      headers: _authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: body ? JSON.stringify(body) : null
    });
    if (response.status === 401 && !isRetry) {
      const refreshed = await handleTokenRefresh();
      if (refreshed) return deleteJson(url, body, true);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }

  /**
   * Call an auth API action (SendMobileOtp, VerifyMobileOtp, LoginWithPassword, etc.)
   * Automatically attaches both X-HappniX-PreAuth and Authorization headers.
   */
  async function callAuthAction(actionItem, data = {}, csrfToken = "", isRetry = false) {
    const headers = { "Content-Type": "application/json" };
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;

    const preAuth = getPreAuthToken();
    if (preAuth) headers["X-HappniX-PreAuth"] = preAuth;

    const response = await fetch(apiUrl("/api/auth"), {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ actionItem, ...data })
    });

    let body = {};
    try { body = await response.json(); } catch (_) { body = {}; }

    // Persist any pre-auth token returned in response
    if (body.preAuthToken) savePreAuthToken(body.preAuthToken);

    // Persist JWT tokens returned after successful login
    if (body.accessToken || body.refreshToken) {
      saveTokens({
        accessToken:  body.accessToken,
        refreshToken: body.refreshToken,
        sessionId:    body.sessionId
      });
    }

    if (!response.ok) throw new Error(body.message || "Request failed.");
    return body;
  }

  // ── Logout ────────────────────────────────────────────────────────────────────
  async function logout() {
    const sessionId = getSessionId();
    try {
      await postJson("/api/auth", { actionItem: "Logout", sessionId: sessionId || undefined });
    } catch (_) {
      // Redirect anyway so the user is not trapped in the signed-in UI
    }
    clearAllTokens();
    window.location.replace("/signup_signin.html");
  }

  // ── Auto-redirect guards ──────────────────────────────────────────────────────
  /**
   * Call on landing pages (index, signin) to skip login if already authenticated.
   * Redirects to /home_page.html if a refresh token exists.
   */
  function redirectIfLoggedIn(destination = "/home_page.html") {
    if (isLoggedIn()) {
      window.location.href = destination;
      return true;
    }
    return false;
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  global.HappniXAuth = {
    // Token helpers
    getAccessToken,
    getRefreshToken,
    getSessionId,
    getPreAuthToken,
    saveTokens,
    savePreAuthToken,
    clearPreAuthToken,
    clearAllTokens,
    isLoggedIn,

    // Network helpers
    apiUrl,
    getJson,
    postJson,
    postFormData,
    deleteJson,
    callAuthAction,

    // Auth flow
    handleTokenRefresh,
    logout,
    redirectIfLoggedIn,
  };
})(window);
