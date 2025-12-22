import axios from 'axios';
import { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
};

// Passes API
export const passesAPI = {
  create: async (barId: string, personCount: number, partyTime: Date) => {
    const { data } = await api.post('/passes', { barId, personCount, partyTime });
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
    const { data } = await api.get('/admin/members');
    return data;
  },

  updateMember: async (id: string, updates: Partial<User>) => {
    const { data } = await api.put(`/admin/members/${id}`, updates);
    return data;
  },

  deleteMember: async (id: string) => {
    const { data } = await api.delete(`/admin/members/${id}`);
    return data;
  },

  getAllPasses: async () => {
    const { data } = await api.get('/admin/passes');
    return data;
  },

  getPaymentSettings: async () => {
    const { data } = await api.get('/admin/payment-settings');
    return data;
  },

  updatePaymentSettings: async (settings: any) => {
    const { data } = await api.put('/admin/payment-settings', settings);
    return data;
  },
};

export default api;
