import axios from 'axios';
import { User, Bar, BarUser } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const ADMIN_TOKEN_KEY = 'admin_token';
export const BAR_TOKEN_KEY = 'bar_token';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getAdminHeaders = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    throw new Error('Admin authentication required');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string, phone: string) => {
    const { data } = await api.post('/auth/register', { email, password, name, phone });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  getProfile: async () => {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  updateProfile: async (updates: Partial<User>) => {
    const { data } = await api.put('/auth/profile', updates);
    return data;
  },

  adminLogin: async (password: string) => {
    const { data } = await api.post('/auth/admin/login', { password });
    if (data.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    }
    return data;
  },

  adminLogout: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },
};

// Admin bar users API
export const adminBarUsersAPI = {
  create: async (input: {
    barId: string;
    email: string;
    password: string;
    displayName: string;
    role?: 'owner' | 'staff';
    isActive?: boolean;
  }) => {
    const { data } = await api.post('/admin/bar-users', input, getAdminHeaders());
    return data as {
      id: string;
      barId: string;
      email: string;
      displayName: string;
      role: 'owner' | 'staff';
      isActive: boolean;
      createdAt: string;
    };
  },
};

// Bars API
export const barsAPI = {
  getAll: async () => {
    const { data } = await api.get('/bars');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/bars/${id}`);
    return data;
  },

  create: async (bar: Omit<Bar, 'id' | 'isFeatured'>) => {
    const { data } = await api.post('/bars', bar, getAdminHeaders());
    return data;
  },

  update: async (id: string, updates: Partial<Bar>) => {
    const { data } = await api.put(`/bars/${id}`, updates, getAdminHeaders());
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/bars/${id}`, getAdminHeaders());
    return data;
  },

  toggleFeatured: async (id: string) => {
    const { data } = await api.post(`/bars/${id}/toggle-featured`, undefined, getAdminHeaders());
    return data;
  },
};

// Passes API
export const passesAPI = {
  create: async (
    barId: string,
    barName: string,
    personCount: number,
    totalPrice: number,
    platformFee: number,
    barPayment: number,
    transactionId?: string | null,
    paymentMethod?: string | null
  ) => {
    const { data } = await api.post('/passes', { barId, barName, personCount, totalPrice, platformFee, barPayment, transactionId, paymentMethod });
    return data;
  },

  getMyPasses: async () => {
    const { data } = await api.get('/passes/my-passes');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/passes/${id}`);
    return data;
  },

  redeem: async (id: string) => {
    const { data } = await api.post(`/passes/${id}/redeem`);
    return data;
  },
};

// Parties API
export const partiesAPI = {
  getAll: async (status?: string) => {
    const { data } = await api.get('/parties', { params: { status } });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/parties/${id}`);
    return data;
  },

  getMyHosted: async () => {
    const { data } = await api.get('/parties/my-hosted');
    return data;
  },

  getMyJoined: async () => {
    const { data } = await api.get('/parties/my-joined');
    return data;
  },

  create: async (partyData: {
    passId: string;
    barId: string;
    barName: string;
    title: string;
    description: string;
    maxFemaleGuests: number;
    partyTime: Date;
  }) => {
    const { data } = await api.post('/parties', partyData);
    return data;
  },

  join: async (id: string) => {
    const { data } = await api.post(`/parties/${id}/join`);
    return data;
  },

  leave: async (id: string) => {
    const { data } = await api.delete(`/parties/${id}/leave`);
    return data;
  },

  cancel: async (id: string) => {
    const { data } = await api.delete(`/parties/${id}`);
    return data;
  },
};

// Admin API
export const adminAPI = {
  getAllMembers: async () => {
    const { data } = await api.get('/admin/members', getAdminHeaders());
    return data;
  },

  updateMember: async (id: string, updates: Partial<User>) => {
    const { data } = await api.put(`/admin/members/${id}`, updates, getAdminHeaders());
    return data;
  },

  deleteMember: async (id: string) => {
    const { data } = await api.delete(`/admin/members/${id}`, getAdminHeaders());
    return data;
  },

  getAllPasses: async () => {
    const { data } = await api.get('/admin/passes', getAdminHeaders());
    return data;
  },

  getPaymentSettings: async () => {
    const { data } = await api.get('/admin/payment-settings', getAdminHeaders());
    return data;
  },

  revokePass: async (id: string) => {
    const { data } = await api.post(`/admin/passes/${id}/revoke`, undefined, getAdminHeaders());
    return data;
  },

  updatePaymentSettings: async (settings: any) => {
    const { data } = await api.put('/admin/payment-settings', settings, getAdminHeaders());
    return data;
  },
};

// Bar Portal API (separate token)
const barApi = axios.create({
  baseURL: `${API_URL}/api/bar-portal`,
  headers: {
    'Content-Type': 'application/json',
  },
});

barApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(BAR_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const barPortalAPI = {
  login: async (email: string, password: string) => {
    const { data } = await barApi.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem(BAR_TOKEN_KEY, data.token);
    }
    return data as { token: string; barUser: BarUser; bar: Bar };
  },
  logout: () => {
    localStorage.removeItem(BAR_TOKEN_KEY);
  },
  me: async () => {
    const { data } = await barApi.get('/auth/me');
    return data as { barUser: BarUser; bar: Bar };
  },
  passesToday: async () => {
    const { data } = await barApi.get('/passes/today');
    return data;
  },
  verifyPass: async (payload: { qrCode?: string; passId?: string }) => {
    const { data } = await barApi.post('/passes/verify', payload);
    return data;
  },
  collectPass: async (passId: string) => {
    const { data } = await barApi.post('/passes/collect', { passId });
    return data;
  },
  paymentsHistory: async (params?: { from?: string; to?: string; status?: 'collected' | 'uncollected' }) => {
    const { data } = await barApi.get('/payments/history', { params });
    return data;
  },
  updateBar: async (updates: Partial<Bar>) => {
    const { data } = await barApi.put('/bar', updates);
    return data;
  },
};

export default api;
