window.HAPPNIX_RUNTIME_CONFIG = {
  apiBaseUrl: "",
  getApiBaseUrl() {
    return String(this.apiBaseUrl || "").replace(/\/$/, "");
  },
  buildApiUrl(path) {
    const cleanPath = path && String(path).startsWith("/") ? path : `/${path || ""}`;
    const base = this.getApiBaseUrl();
    return base ? `${base}${cleanPath}` : cleanPath;
  },
};
