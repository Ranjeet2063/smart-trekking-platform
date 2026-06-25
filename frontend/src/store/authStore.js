import { create } from 'zustand';
import { authAPI } from '../services/api';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
};

export const useAuthStore = create((set, get) => ({
  ...initialState,

  initialize: async () => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        set({
          user: parsed.user,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          isAuthenticated: true,
        });
        return;
      } catch {
        localStorage.removeItem('auth');
      }
    }
    await get().demoLogin();
  },

  demoLogin: async () => {
    try {
      const { data } = await authAPI.login({ email: '123@demo.com', password: '123' });
      const authData = {
        user: data.data.user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      set({ ...authData, isAuthenticated: true });
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login({ email, password });
      const authData = {
        user: data.data.user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      set({ ...authData, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(userData);
      const authData = {
        user: data.data.user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      set({ ...authData, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  googleLogin: async (credential) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.google(credential);
      const authData = {
        user: data.data.user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      set({ ...authData, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    const refreshToken = get().refreshToken;
    authAPI.logout(refreshToken).catch(() => {});
    localStorage.removeItem('auth');
    set({ ...initialState });
  },

  setTokens: (tokens) => {
    const state = get();
    const authData = { ...state, ...tokens };
    localStorage.setItem('auth', JSON.stringify(authData));
    set(authData);
  },

  setUser: (user) => {
    const state = get();
    const authData = { ...state, user };
    localStorage.setItem('auth', JSON.stringify(authData));
    set({ user });
  },
}));
