export type UserRole = 'admin' | 'manager' | 'operator';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  businessNo: string | null;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  managerId: string | null;
  createdAt: string;
}
