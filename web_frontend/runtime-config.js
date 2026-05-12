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
