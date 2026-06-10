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
  (error: AxiosError<any>) => {
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
    await clearSession();
    return { success: true };
  },
};

export const profileApi = {
  me: () => api.get('/api/profile/me'),
  updateProfile: (data: any) => api.post('/api/profile/update', data),
  completeProfile: (data: any) => api.post('/api/signup/profile', data),
  getFollowers: () => api.get('/api/profile/followers'),
  getFollowing: () => api.get('/api/profile/following'),
  getFollowRequests: () => api.get('/api/profile/follow-requests'),
  handleFollowRequest: (requesterUserId: number, action: 'approve' | 'deny') =>
    api.post('/api/profile/follow-requests', { requesterUserId, action }),
  getPrivacy: () => api.get('/api/profile/privacy'),
  setPrivacy: (isPrivate: boolean) => api.post('/api/profile/privacy', { isPrivate }),
  sendAadhaarOtp: (aadhaarNumber: string) =>
    api.post('/api/auth/aadhaar/send-otp', { aadhaarNumber }),
  verifyAadhaarOtp: (otp: string) => api.post('/api/auth/aadhaar/verify-otp', { otp }),
  deleteAccount: () => api.post('/api/profile/me', { actionItem: 'deleteAccount' }),
};

export const eventApi = {
  nearby: (latitude = 26.9124, longitude = 75.7873, radiusKm = 50) =>
    api.get('/api/events/nearby', { params: { latitude, longitude, radiusKm } }),
  live: () => api.get('/api/events/live'),
  mine: () => api.get('/api/events/mine'),
  getById: (eventId: number | string) => api.get(`/api/events/${eventId}`),
  create: (formData: FormData) =>
    api.post('/api/events/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (eventId: number | string) => api.delete(`/api/events/${eventId}`),
};

export const ticketApi = {
  getAll: () => api.get('/api/tickets'),
  book: (eventId: number | string, passType: string, quantity: number) =>
    api.post('/api/tickets/book', { event_id: eventId, pass_type: passType, quantity }),
  pay: (ticketId: number | string, paymentMethod: string) =>
    api.post(`/api/tickets/${ticketId}/pay`, { payment_method: paymentMethod }),
  updateGroup: (ticketId: number | string, groupInfo: any) =>
    api.post(`/api/tickets/${ticketId}/group`, groupInfo),
  cancel: (ticketId: number | string) => api.post(`/api/tickets/${ticketId}/cancel`),
  archive: (ticketId: number | string) => api.post(`/api/tickets/${ticketId}/archive`),
  delete: (ticketId: number | string) => api.delete(`/api/tickets/${ticketId}/delete`),
};

export const userApi = {
  search: (query: string, limit = 20) => api.get('/api/users/search', { params: { q: query, limit } }),
  publicProfile: (userId: number | string) => api.get(`/api/users/${userId}/profile`),
  follow: (targetUserId: number | string) => api.post('/api/users/follow', { target_user_id: targetUserId }),
  unfollow: (targetUserId: number | string) => api.post('/api/users/unfollow', { target_user_id: targetUserId }),
};

export const notificationApi = {
  getAll: () => api.get('/api/notifications'),
  markRead: () => api.post('/api/notifications'),
};

export const messagingApi = {
  getConversations: () => api.get('/api/messages/conversations'),
  startConversation: (targetUserId: number | string) =>
    api.post('/api/messages/conversations/start', { target_user_id: targetUserId }),
  getMessages: (conversationId: number | string) =>
    api.get(`/api/messages/conversations/${conversationId}/messages`),
  markRead: (conversationId: number | string) =>
    api.post(`/api/messages/conversations/${conversationId}/read`),
  sendMessage: (conversationId: number | string, body: string, repliedToId?: number | string) =>
    api.post(`/api/messages/conversations/${conversationId}/messages`, {
      body,
      ...(repliedToId ? { repliedToId } : {}),
    }),
  sendMessageWithAttachments: (
    conversationId: number | string,
    body: string,
    files: { uri: string; name: string; type: string }[],
    attachmentMeta?: { durationSeconds?: number | null }[],
  ) => {
    const formData = new FormData();
    formData.append('body', body);
    files.forEach((file) => {
      formData.append('attachments', file as any);
    });
    if (attachmentMeta) formData.append('attachmentMeta', JSON.stringify(attachmentMeta));
    return api.post(`/api/messages/conversations/${conversationId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  editMessage: (messageId: number | string, content: string) =>
    api.post(`/api/messages/messages/${messageId}/edit`, { content }),
  forwardMessage: (messageId: number | string, targetUserId: number | string) =>
    api.post(`/api/messages/messages/${messageId}/forward`, { target_user_id: targetUserId }),
  deleteMessage: (messageId: number | string) => api.post(`/api/messages/messages/${messageId}/delete`),
  unsendMessage: (messageId: number | string) => api.post(`/api/messages/messages/${messageId}/unsend`),
  clearConversation: (conversationId: number | string) =>
    api.post(`/api/messages/conversations/${conversationId}/clear`),
  deleteConversation: (conversationId: number | string) =>
    api.delete(`/api/messages/conversations/${conversationId}`),
};

export const groupTicketApi = {
  getGroup: (ticketId: number | string) => api.get(`/api/tickets/${ticketId}/group`),
  updateGroup: (
    ticketId: number | string,
    data: { inviteeUserIds?: number[]; removeUserIds?: number[]; paidForUserIds?: number[] },
  ) => api.post(`/api/tickets/${ticketId}/group`, data),
  generateInvite: (ticketId: number | string) => api.post(`/api/tickets/${ticketId}/invite/generate`),
  acceptInvite: (uuid: string) => api.post('/api/tickets/invite/accept', { uuid }),
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
