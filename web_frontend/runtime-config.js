window.HAPPNIX_RUNTIME_CONFIG = {
  apiBaseUrl: "https://5imeml8ibf.execute-api.ap-south-1.amazonaws.com/dev",
  cognitoRegion: "ap-south-1",
  cognitoUserPoolId: "ap-south-1_9PbN3qrkN",
  cognitoUserPoolClientId: "68uu3j15hdf4dpqr6d91s7iu3e",
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
