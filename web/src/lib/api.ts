import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://u9zfrut1t9.execute-api.ap-south-1.amazonaws.com/dev";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to dynamically inject pre-auth and bearer authentication tokens
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Inject pre-auth token (OTP/signup flow)
    const preAuthToken = localStorage.getItem("happnix_pre_auth_token");
    if (preAuthToken) {
      config.headers["X-HappniX-PreAuth"] = preAuthToken;
    }
    
    // Inject bearer token (JWT flow), except for auth endpoints
    const accessToken = localStorage.getItem("happnix_access_token");
    const isAuthEndpoint = config.url?.includes("/api/auth");
    if (accessToken && !isAuthEndpoint) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    
    // Clear storage on logout request
    if (config.data?.actionItem === "Logout") {
      localStorage.removeItem("happnix_pre_auth_token");
      localStorage.removeItem("happnix_access_token");
      localStorage.removeItem("happnix_refresh_token");
      localStorage.removeItem("happnix_session_id");
      
      // If a logout call is made to the backend, prevent it from firing since backend auth is removed
      if (isAuthEndpoint) {
        return Promise.reject(new axios.Cancel("Logout handled locally."));
      }
    }
  }
  return config;
});

// Response interceptor to handle token stashing and standardized error messages
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof window !== "undefined") {
      // Automatically stash returned pre-auth token
      if (data.preAuthToken) {
        localStorage.setItem("happnix_pre_auth_token", data.preAuthToken);
      }
      // Automatically stash returned bearer JWT
      if (data.accessToken) {
        localStorage.setItem("happnix_access_token", data.accessToken);
      }
      // Automatically stash refresh token and session ID
      if (data.refreshToken) {
        localStorage.setItem("happnix_refresh_token", data.refreshToken);
      }
      if (data.sessionId) {
        localStorage.setItem("happnix_session_id", data.sessionId);
      }
      // Clear pre-auth token on signup completion or transition back to login
      const nextStatus = data.userStatus || data.next || "";
      if (nextStatus === "existing" || data.redirectUrl?.includes("/login")) {
        localStorage.removeItem("happnix_pre_auth_token");
      }
    }
    return data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Request failed. Please try again.";
    return Promise.reject(new Error(message));
  }
);
