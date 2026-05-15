import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '@metroai/types';

interface AuthState {
  user: AuthResponse['user'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (resp: AuthResponse) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (resp) =>
        set({
          user: resp.user,
          accessToken: resp.accessToken,
          refreshToken: resp.refreshToken,
        }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'metroai-auth' },
  ),
);
