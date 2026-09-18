import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AdminAuthStore {
  user: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAdminAuth = create<AdminAuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.user.role !== 'ADMIN') {
          throw new Error('Tài khoản không có quyền admin');
        }
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
      },

      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'admin-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
