import axios from "axios";
import { CreatedEventType } from "@/types/event";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://u9zfrut1t9.execute-api.ap-south-1.amazonaws.com/dev";
const API_BASE = RAW_API_BASE.endsWith("/") ? RAW_API_BASE : `${RAW_API_BASE}/`;

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
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
      } else if (config.headers) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    // Clear storage on logout request
    if (config.data?.actionItem === "Logout") {
      localStorage.removeItem("happnix_pre_auth_token");
      localStorage.removeItem("happnix_access_token");
      localStorage.removeItem("happnix_refresh_token");
      localStorage.removeItem("happnix_session_id");
      
      // Clear event caches so data doesn't bleed between accounts
      localStorage.removeItem("happnix_created_events_v4");
      localStorage.removeItem("happnix_event_live_states_v4");
      localStorage.removeItem("happnix_event_stats_v4");

      // If a logout call is made to the backend, prevent it from firing since backend auth is removed
      if (isAuthEndpoint || config.url?.includes("/api/home/logout")) {
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
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("happnix_refresh_token");
        if (refreshToken) {
          try {
            const response = await axios.post(API_BASE + "api/auth", {
              actionItem: "RefreshToken",
              refreshToken: refreshToken
            });
            const data = response.data;
            if (data.success && data.accessToken) {
              localStorage.setItem("happnix_access_token", data.accessToken);
              if (data.refreshToken) {
                localStorage.setItem("happnix_refresh_token", data.refreshToken);
              }
              if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
                originalRequest.headers.set("Authorization", `Bearer ${data.accessToken}`);
              } else if (originalRequest.headers) {
                originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
              }
              return apiClient(originalRequest);
            }
          } catch (refreshError) {
            // refresh token is probably expired too
          }
        }

        localStorage.removeItem("happnix_access_token");
        localStorage.removeItem("happnix_pre_auth_token");
        localStorage.removeItem("happnix_refresh_token");
        localStorage.removeItem("happnix_session_id");

        // Prevent infinite reload loops if already on auth pages
        if (!window.location.pathname.includes("/signin") && !window.location.pathname.includes("/signup")) {
          window.location.href = "/signin";
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Request failed. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export const uploadMediaToR2 = async (file: File, eventId: string): Promise<string | null> => {
  try {
    const res = (await apiClient.post("api/events", {
      actionItem: "GetMediaUploadUrl",
      fileName: file.name.replace(/[^a-zA-Z0-9.-]/g, "_"), // Sanitize filename
      contentType: file.type,
      eventId: eventId
    })) as any;

    if (!res.success) return null;

    const { uploadUrl, objectKey } = res;

    // Upload directly to R2
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type
      }
    });

    if (uploadRes.ok) {
      const publicBase = process.env.NEXT_PUBLIC_R2_USERMEDIA_BUCKET_PUBID || "https://pub-09453339054e4d8894deb9f536888434.r2.dev";
      return `${publicBase}/${objectKey}`;
    }
    return null;
  } catch (err) {
    console.error("Upload failed", err);
    return null;
  }
};

export const deleteMediaFromR2 = async (url: string): Promise<boolean> => {
  try {
    const publicBase = process.env.NEXT_PUBLIC_R2_USERMEDIA_BUCKET_PUBID || "https://pub-09453339054e4d8894deb9f536888434.r2.dev";
    if (!url.startsWith(publicBase)) return false;

    const objectKey = url.replace(`${publicBase}/`, "");
    const res = (await apiClient.post("api/events", {
      actionItem: "DeleteMedia",
      objectKey
    })) as any;
    return !!res.success;
  } catch (err) {
    console.error("Delete media failed", err);
    return false;
  }
};

export const processEventMedia = async (eventData: CreatedEventType): Promise<CreatedEventType> => {
  const processed = { ...eventData };

  const base64ToFile = (base64: string, filename: string): File | null => {
    try {
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1];
      if (!mime) return null;
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (e) {
      return null;
    }
  };

  if (processed.bannerUrl?.startsWith("data:image")) {
    const file = base64ToFile(processed.bannerUrl, `banner_${Date.now()}.jpg`);
    if (file) {
      const url = await uploadMediaToR2(file, processed.id);
      if (url) processed.bannerUrl = url;
    }
  }

  if (processed.highlights && processed.highlights.length > 0) {
    const newHighlights = [...processed.highlights];
    for (let i = 0; i < newHighlights.length; i++) {
      if (newHighlights[i].startsWith("data:image")) {
        const file = base64ToFile(newHighlights[i], `highlight_${Date.now()}_${i}.jpg`);
        if (file) {
          const url = await uploadMediaToR2(file, processed.id);
          if (url) newHighlights[i] = url;
        }
      }
    }
    processed.highlights = newHighlights;
  }

  return processed;
};

export const userApi = {
  search: (query: string, limit = 20) => apiClient.get('/api/users/search', { params: { q: query, limit } }),
  publicProfile: (userId: number | string) => apiClient.get(`/api/users/${userId}/profile`),
  follow: (targetUserId: number | string) => apiClient.post('/api/profile/me', { actionItem: 'toggleFollow', targetUserId }),
  unfollow: (targetUserId: number | string) => apiClient.post('/api/profile/me', { actionItem: 'toggleFollow', targetUserId }),
  toggleFollow: (targetUserId: number | string) => apiClient.post('/api/profile/me', { actionItem: 'toggleFollow', targetUserId }),
  getFollowers: (userId: number | string, limit = 20, offset = 0) => apiClient.get('/api/profile/followers', { params: { userId, limit, offset } }),
  getFollowing: (userId: number | string, limit = 20, offset = 0) => apiClient.get('/api/profile/following', { params: { userId, limit, offset } }),
};

export const discoverApi = {
  search: (query: string, limit = 50) => apiClient.get('/api/discover/search', { params: { q: query, limit } }),
};

export const bookingApi = {
  bookTicket: (data: { eventID: string; tierID: string; quantity: number }) =>
    apiClient.post('/api/booking', { actionItem: 'BookTicket', ...data }),
  getMyBookings: () =>
    apiClient.get('/api/booking'),
  cancelTicket: (ticketID: string) =>
    apiClient.post('/api/booking', { actionItem: 'CancelTicket', ticketID }),
  getEventTiers: (eventID: string) =>
    apiClient.get('/api/booking', { params: { eventID } }),
};

export const fixAvatarUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined" || trimmed === "None") return null;
  
  const oldBase1 = "https://happnix-dev-new.ronakgo1.workers.dev/";
  const oldBase2 = "https://happnix-dev-new.ronakgo1.workers.dev";
  
  if (trimmed === oldBase1 || trimmed === oldBase2) return null;
  
  const newBase = process.env.NEXT_PUBLIC_R2_USERMEDIA_BUCKET_PUBID || process.env.NEXT_PUBLIC_R2_USERMEDIA_BUCKET_PUB || "https://pub-09453339054e4d8894deb9f536888434.r2.dev";
  const cleanNewBase = newBase.endsWith("/") ? newBase : newBase + "/";

  if (trimmed.includes("happnix-dev-new.ronakgo1.workers.dev")) {
    return trimmed.replace(oldBase1, cleanNewBase).replace(oldBase2, cleanNewBase.slice(0, -1));
  }
  
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  
  // Preserve static local frontend assets
  if (trimmed.startsWith("/default-") || trimmed.startsWith("/Happnix") || trimmed.startsWith("/file.svg") || trimmed.startsWith("/globe.svg") || trimmed.startsWith("/window.svg") || trimmed.startsWith("/next.svg") || trimmed.startsWith("/vercel.svg")) {
    return trimmed;
  }
  
  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${cleanNewBase}${cleanPath}`;
};



