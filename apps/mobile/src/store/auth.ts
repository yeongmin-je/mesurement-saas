import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthResponse } from '@metroai/types';

const ACCESS_KEY = 'metroai.accessToken';
const REFRESH_KEY = 'metroai.refreshToken';

interface AuthState {
  user: AuthResponse['user'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setSession: (resp: AuthResponse) => Promise<void>;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  async hydrate() {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    set({ accessToken: access, refreshToken: refresh });
  },
  async setSession(resp) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, resp.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, resp.refreshToken),
    ]);
    set({ user: resp.user, accessToken: resp.accessToken, refreshToken: resp.refreshToken });
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
