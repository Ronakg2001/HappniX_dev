window.HAPPNIX_RUNTIME_CONFIG = {
  apiBaseUrl: "https://u9zfrut1t9.execute-api.ap-south-1.amazonaws.com/dev",
  cognitoRegion: "ap-south-1",
  cognitoUserPoolId: "ap-south-1_QSro12anU",
  cognitoUserPoolClientId: "4rbpkmg4inqn8evi1fu7gu95kt",
  getApiBaseUrl() {
    return String(this.apiBaseUrl || "").replace(/\/$/, "");
  },
  getCognitoConfig() {
    return {
      region: String(this.cognitoRegion || ""),
      userPoolId: String(this.cognitoUserPoolId || ""),
      userPoolClientId: String(this.cognitoUserPoolClientId || ""),
    };
  },
  buildApiUrl(path) {
    const cleanPath =
      path && String(path).startsWith("/") ? path : `/${path || ""}`;
    const base = this.getApiBaseUrl();
    return base ? `${base}${cleanPath}` : cleanPath;
  },
};

// Fetch current user profile from backend and expose as window.__HAPPNIX_CONFIG__
// so home_page.html can hydrate username, avatar, and verification status.
(function () {
  const api = window.HAPPNIX_RUNTIME_CONFIG.getApiBaseUrl();
  fetch(`${api}/auth`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionItem: "GetCurrentUser" }),
  })
    .then((r) => r.json())
    .then((data) => {
      window.__HAPPNIX_CONFIG__ = {
        currentUsername: data.username || data.userName || "",
        currentAvatarUrl: data.avatarUrl || data.profilePictureUrl || "",
        isVerified: data.isVerified || data.adharVerified || false,
      };
      // Dispatch event so home_page.html include-loader can pick it up
      document.dispatchEvent(new CustomEvent("happnix:config-ready", { detail: window.__HAPPNIX_CONFIG__ }));
    })
    .catch(() => {
      window.__HAPPNIX_CONFIG__ = { currentUsername: "", currentAvatarUrl: "", isVerified: false };
    });
})();

