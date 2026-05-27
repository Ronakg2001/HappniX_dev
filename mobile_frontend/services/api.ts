import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/backend';

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // Required to bypass localtunnel security landing page
  },
});

// Intercept requests to add Authorization header
api.interceptors.request.use(
  async (config) => {
    try {
      if (config.url && config.url.startsWith('/api/auth')) {
        return config;
      }
      
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`; 
      }
    } catch (e) {
      console.error('Error fetching token from SecureStore', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Auth APIs ──────────────────────────────────────────────

export const authApi = {
  loginWithPassword: (identifier: string, password: string) =>
    api.post('/api/auth/username/login', { identifier, password }),

  sendMobileOtp: (mobile: string) =>
    api.post('/api/auth/mobile/send-otp', { mobile }),

  resendMobileOtp: (mobile: string) =>
    api.post('/api/auth/mobile/resend-otp', { mobile }),

  verifyMobileOtp: (mobile: string, otp: string) =>
    api.post('/api/auth/mobile/verify-otp', { mobile, otp }),

  forgotPassword: (email: string) =>
    api.post('/api/auth/password/forgot', { email }),

  registerDetails: (data: {
    fullName: string;
    username: string;
    password: string;
    email: string;
    sex: string;
    dateOfBirth: string;
    govId?: string;
  }) => api.post('/api/signup/details', data),

  completeProfile: (data: { bio?: string; profilePictureUrl?: string; skip?: boolean }) =>
    api.post('/api/signup/profile', data),

  logout: () => api.post('/logout/'),
};

// ── Profile APIs ───────────────────────────────────────────

export const profileApi = {
  me: () => api.get('/api/profile/me'),

  sendAadhaarOtp: (aadhaarNumber: string) =>
    api.post('/api/auth/aadhaar/send-otp', { aadhaarNumber }),

  verifyAadhaarOtp: (otp: string) =>
    api.post('/api/auth/aadhaar/verify-otp', { otp }),

  getPrivacy: () => api.get('/api/profile/privacy'),

  setPrivacy: (isPrivate: boolean) =>
    api.post('/api/profile/privacy', { isPrivate }),

  getFollowRequests: () => api.get('/api/profile/follow-requests'),

  handleFollowRequest: (requesterUserId: number, action: 'approve' | 'deny') =>
    api.post('/api/profile/follow-requests', { requesterUserId, action }),

  getFollowers: () => api.get('/api/profile/followers'),

  getFollowing: () => api.get('/api/profile/following'),

  updateProfile: (data: any) => api.post('/api/profile/update', data),

  getFollowGraph: (graphType: string) => api.get(`/api/profile/${graphType}`),
};

// ── Settings API ───────────────────────────────────────────

export const settingsApi = {
  getPreferences: () => api.get('/api/settings/preferences'),
  updatePreferences: (data: any) => api.post('/api/settings/preferences', data),
  getPeopleByCategory: (category: string) => api.get(`/api/settings/people/${category}`),
};

// ── Event APIs ─────────────────────────────────────────────

export const eventApi = {
  nearby: (latitude: number, longitude: number, radiusKm = 50) =>
    api.get('/api/events/nearby', { params: { latitude, longitude, radiusKm } }),

  mine: () => api.get('/api/events/mine'),

  create: (formData: FormData) =>
    api.post('/api/events/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (eventId: number) =>
    api.delete(`/api/events/${eventId}`),
};

// ── Ticket APIs ────────────────────────────────────────────

export const ticketApi = {
  getAll: () => api.get('/api/tickets'),

  book: (eventId: number | string, passType: string, quantity: number) =>
    api.post('/api/tickets/book', { event_id: eventId, pass_type: passType, quantity }),

  pay: (ticketId: number | string, paymentMethod: string) =>
    api.post(`/api/tickets/${ticketId}/pay`, { payment_method: paymentMethod }),

  updateGroup: (ticketId: number | string, groupInfo: any) =>
    api.post(`/api/tickets/${ticketId}/group`, groupInfo),

  cancel: (ticketId: number | string) =>
    api.post(`/api/tickets/${ticketId}/cancel`),

  archive: (ticketId: number | string) =>
    api.post(`/api/tickets/${ticketId}/archive`),

  delete: (ticketId: number | string) =>
    api.delete(`/api/tickets/${ticketId}/delete`),
};

// ── User Search API ────────────────────────────────────────

export const userApi = {
  search: (query: string, limit = 20) =>
    api.get('/api/users/search', { params: { q: query, limit } }),

  publicProfile: (userId: number | string) =>
    api.get(`/api/users/${userId}/profile`),

  follow: (targetUserId: number | string) =>
    api.post('/api/users/follow', { target_user_id: targetUserId }),

  unfollow: (targetUserId: number | string) =>
    api.post('/api/users/unfollow', { target_user_id: targetUserId }),
};

// ── Notification APIs ──────────────────────────────────────

export const notificationApi = {
  getAll: () => api.get('/api/notifications'),
  markRead: () => api.post('/api/notifications'),
};

// ── Messaging APIs ─────────────────────────────────────────

export const messagingApi = {
  getConversations: () => api.get('/api/messages/conversations'),

  startConversation: (targetUserId: number | string) =>
    api.post('/api/messages/conversations/start', { target_user_id: targetUserId }),

  getMessages: (conversationId: number | string) =>
    api.get(`/api/messages/conversations/${conversationId}/messages`),

  markRead: (conversationId: number | string) =>
    api.post(`/api/messages/conversations/${conversationId}/read`),

  editMessage: (messageId: number | string, content: string) =>
    api.post(`/api/messages/messages/${messageId}/edit`, { content }),

  forwardMessage: (messageId: number | string, targetUserId: number | string) =>
    api.post(`/api/messages/messages/${messageId}/forward`, { target_user_id: targetUserId }),

  deleteMessage: (messageId: number | string) =>
    api.post(`/api/messages/messages/${messageId}/delete`),

  unsendMessage: (messageId: number | string) =>
    api.post(`/api/messages/messages/${messageId}/unsend`),

  sendMessage: (conversationId: number | string, body: string, repliedToId?: number | string) =>
    api.post(`/api/messages/conversations/${conversationId}/messages`, {
      body,
      ...(repliedToId ? { repliedToId } : {}),
    }),

  // #11: Send message with file/image/voice attachments (multipart)
  sendMessageWithAttachments: (
    conversationId: number | string,
    body: string,
    files: { uri: string; name: string; type: string }[],
    attachmentMeta?: { durationSeconds?: number | null }[],
  ) => {
    const formData = new FormData();
    formData.append('body', body);
    files.forEach((file) => {
      formData.append('attachments', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
    if (attachmentMeta) {
      formData.append('attachmentMeta', JSON.stringify(attachmentMeta));
    }
    return api.post(
      `/api/messages/conversations/${conversationId}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  clearConversation: (conversationId: number | string) =>
    api.post(`/api/messages/conversations/${conversationId}/clear`),

  deleteConversation: (conversationId: number | string) =>
    api.delete(`/api/messages/conversations/${conversationId}`),
};

// ── Group Ticket APIs (#20) ─────────────────────────────────

export const groupTicketApi = {
  /** Get group members for a ticket */
  getGroup: (ticketId: number | string) =>
    api.get(`/api/tickets/${ticketId}/group`),

  /** Add/remove members, update payer */
  updateGroup: (
    ticketId: number | string,
    data: {
      inviteeUserIds?: number[];
      removeUserIds?: number[];
      paidForUserIds?: number[];
    },
  ) => api.post(`/api/tickets/${ticketId}/group`, data),

  /** Generate a shareable invite UUID link */
  generateInvite: (ticketId: number | string) =>
    api.post(`/api/tickets/${ticketId}/invite/generate`),

  /** Accept a group ticket invite via UUID */
  acceptInvite: (uuid: string) =>
    api.post(`/api/tickets/invite/accept`, { uuid }),
};

// ── Event Categories (from manifest) ───────────────────────

export const EVENT_CATEGORIES = [
  'Fake wedding',
  'Holi party',
  'Prom night',
  'Concert',
  'Halloween',
  'Lights out',
  'New year',
  'Pool',
  'Pre Diwali',
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
