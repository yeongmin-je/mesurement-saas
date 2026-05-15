import type { User } from '../domain/user';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  tenantName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'tenantId'>;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}
