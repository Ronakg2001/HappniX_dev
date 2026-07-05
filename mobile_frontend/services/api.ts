import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/backend';

const TOKEN_KEYS = {
  preAuth: 'happnix_pre_auth_token',
  access: 'happnix_access_token',
  refresh: 'happnix_refresh_token',
  session: 'happnix_session_id',
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const preAuthToken = await SecureStore.getItemAsync(TOKEN_KEYS.preAuth);
  if (preAuthToken) {
    config.headers['X-HappniX-PreAuth'] = preAuthToken;
  }

  const isAuthEndpoint = config.url?.includes('/api/auth');
  const accessToken = await SecureStore.getItemAsync(TOKEN_KEYS.access);
  if (accessToken && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  async (response) => {
    const data = response.data;
    if (data?.preAuthToken) await SecureStore.setItemAsync(TOKEN_KEYS.preAuth, data.preAuthToken);
    if (data?.accessToken) await SecureStore.setItemAsync(TOKEN_KEYS.access, data.accessToken);
    if (data?.refreshToken) await SecureStore.setItemAsync(TOKEN_KEYS.refresh, data.refreshToken);
    if (data?.sessionId) await SecureStore.setItemAsync(TOKEN_KEYS.session, data.sessionId);

    const nextStatus = data?.userStatus || data?.next || '';
    if (nextStatus === 'existing' || data?.redirectUrl?.includes('/login')) {
      await SecureStore.deleteItemAsync(TOKEN_KEYS.preAuth);
    }

    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.refresh);
      if (refreshToken) {
        try {
          const response = await axios.post(API_BASE_URL + '/api/auth', {
            actionItem: 'RefreshToken',
            refreshToken: refreshToken
          });
          const data = response.data;
          if (data.success && data.accessToken) {
            await SecureStore.setItemAsync(TOKEN_KEYS.access, data.accessToken);
            if (data.refreshToken) {
              await SecureStore.setItemAsync(TOKEN_KEYS.refresh, data.refreshToken);
            }
            if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set("Authorization", `Bearer ${data.accessToken}`);
            } else if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
            }
            return api(originalRequest);
          }
        } catch (refreshError) {
          // refresh token is probably expired too
        }
      }

      await clearSession();
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed. Please try again.';
    return Promise.reject(new Error(message));
  },
);

export async function hasAccessToken() {
  return Boolean(await SecureStore.getItemAsync(TOKEN_KEYS.access));
}

export async function clearSession() {
  await Promise.all(Object.values(TOKEN_KEYS).map((key) => SecureStore.deleteItemAsync(key)));
}

export const authApi = {
  getCountryCodes: () => api.post('/api/auth', { actionItem: 'GetCountryCodes' }),
  sendMobileOtp: (mobile: string, region = 'IN') =>
    api.post('/api/auth', { actionItem: 'SendMobileOtp', mobile, region }),
  resendMobileOtp: (mobile: string) =>
    api.post('/api/auth', { actionItem: 'ResendMobileOtp', mobile }),
  verifyMobileOtp: (mobile: string, otp: string) =>
    api.post('/api/auth', { actionItem: 'VerifyMobileOtp', mobile, otp }),
  loginWithPassword: (identifier: string, password: string) =>
    api.post('/api/auth', { actionItem: 'LoginWithPassword', identifier, password }),
  checkUsername: (username: string) =>
    api.post('/api/auth', { actionItem: 'CheckUsername', username }),
  registerDetails: (data: {
    fullName: string;
    username: string;
    password: string;
    gender?: string;
    sex?: string;
    dateOfBirth: string;
    email: string;
    mobile?: string;
    region?: string;
    govId?: string;
  }) => api.post('/api/auth', { actionItem: 'RegisterUserDetails', ...data }),
  forgotPassword: (email: string) => api.post('/api/auth', { actionItem: 'ForgotPassword', email }),
  completeProfile: (data: { bio?: string; profilePictureUrl?: string; skip?: boolean }) =>
    api.post('/api/signup/profile', data),
  logout: async () => {
    try {
      // Fire backend logout to revoke Cognito tokens globally
      await api.post('/api/home/logout', { actionItem: 'Logout' });
    } catch (_) {
      // Backend logout failure is non-fatal — still clear local session
    }
    await clearSession();
    return { success: true };
  },
  refreshToken: (token: string) => api.post('/api/auth', { actionItem: 'RefreshToken', refreshToken: token }),
};

export const profileApi = {
  me: () => api.get('/api/profile/me'),
  updateProfile: (data: any) =>
    api.post('/api/profile/me', { actionItem: 'update_user_profile', ...data }),
  completeProfile: (data: any) => api.post('/api/signup/profile', data),
  getFollowers: () => api.get('/api/profile/followers'),
  getFollowing: () => api.get('/api/profile/following'),
  checkUsername: (username: string) =>
    api.post('/api/profile/me', { actionItem: 'check_username', target_username: username }),
  deleteAccount: () => api.post('/api/profile/me', { actionItem: 'deleteAccount' }),
  // @NOT_IMPLEMENTED — Backend stubs (501). Keep for future wiring.
  getFollowRequests: () => api.get('/api/profile/follow-requests'),
  handleFollowRequest: (requesterUserId: number, action: 'approve' | 'deny') =>
    api.post('/api/profile/follow-requests', { requesterUserId, action }),
  sendAadhaarOtp: (aadhaarNumber: string) =>
    api.post('/api/auth/aadhaar/send-otp', { aadhaarNumber }),
  verifyAadhaarOtp: (otp: string) => api.post('/api/auth/aadhaar/verify-otp', { otp }),
};

export const eventApi = {
  // GET /api/events → GetMyEvents (backend reads GET as implicit action)
  mine: () => api.get('/api/events'),
  // POST /api/events with actionItem body
  createDraft: (eventData: any) =>
    api.post('/api/events', { actionItem: 'CreateEventDraft', eventData, ...eventData }),
  publish: (eventData: any) =>
    api.post('/api/events', { actionItem: 'PublishEvent', eventData, ...eventData }),
  delete: (eventID: string) =>
    api.post('/api/events', { actionItem: 'DeleteEvent', eventID }),
  getMediaUploadUrl: (fileName: string, contentType: string, eventId: string) =>
    api.post('/api/events', { actionItem: 'GetMediaUploadUrl', fileName, contentType, eventId }),
  deleteMedia: (objectKey: string) =>
    api.post('/api/events', { actionItem: 'DeleteMedia', objectKey }),
};

export const bookingApi = {
  // GET /api/booking → user's bookings
  getMyBookings: () => api.get('/api/booking'),
  // GET /api/booking?eventID=xxx → event tiers for booking modal
  getEventTiers: (eventID: string) =>
    api.get('/api/booking', { params: { eventID } }),
  // POST /api/booking with actionItem
  bookTicket: (data: { eventID: string; tierID: string; quantity: number }) =>
    api.post('/api/booking', { actionItem: 'BookTicket', ...data }),
  cancelTicket: (ticketID: string) =>
    api.post('/api/booking', { actionItem: 'CancelTicket', ticketID }),
};

export const userApi = {
  search: (query: string, limit = 20) =>
    api.get('/api/discover/search', { params: { q: query, limit } }),
  publicProfile: (userId: number | string) =>
    api.get(`/api/users/${userId}/profile`),
  // Follow/unfollow is a toggle via the profile handler
  toggleFollow: (targetUserId: number | string) =>
    api.post('/api/profile/me', { actionItem: 'toggleFollow', targetUserId }),
};

// ─────────────────────────────────────────────────────────────────────────────
// @NOT_IMPLEMENTED — These features have no backend handler yet.
// Keep the interfaces for future wiring; calls will return 501.
// ─────────────────────────────────────────────────────────────────────────────

export const notificationApi = {
  /** @NOT_IMPLEMENTED */ getAll: () => api.get('/api/notifications'),
  /** @NOT_IMPLEMENTED */ markRead: () => api.post('/api/notifications'),
};

export const messagingApi = {
  /** @NOT_IMPLEMENTED */ getConversations: () => api.get('/api/messages/conversations'),
  /** @NOT_IMPLEMENTED */ startConversation: (targetUserId: number | string) =>
    api.post('/api/messages/conversations/start', { target_user_id: targetUserId }),
  /** @NOT_IMPLEMENTED */ getMessages: (conversationId: number | string) =>
    api.get(`/api/messages/conversations/${conversationId}/messages`),
  /** @NOT_IMPLEMENTED */ sendMessage: (conversationId: number | string, body: string) =>
    api.post(`/api/messages/conversations/${conversationId}/messages`, { body }),
};

export const EVENT_CATEGORIES = [
  'Fake wedding',
  'Holi party',
  'Prom night',
  'Concert',
  'Halloween',
  'Lights out',
  'New year',
  'Pool',
  'Live concerts',
  'Comedy shows',
  'Dj nights',
  'House party',
  'Club parties',
  'Open mic nights',
  'Navratri',
  'Art and craft exhibitions',
  'Ladies night',
];

export default api;
