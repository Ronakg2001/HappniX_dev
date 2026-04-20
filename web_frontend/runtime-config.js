window.HAPPNIX_RUNTIME_CONFIG = {
  apiBaseUrl: "https://5imeml8ibf.execute-api.ap-south-1.amazonaws.com/dev",
  getApiBaseUrl() {
    return String(this.apiBaseUrl || "").replace(/\/$/, "");
  },
  buildApiUrl(path) {
    const cleanPath = path && String(path).startsWith("/") ? path : `/${path || ""}`;
    const base = this.getApiBaseUrl();
    return base ? `${base}${cleanPath}` : cleanPath;
  },
};
