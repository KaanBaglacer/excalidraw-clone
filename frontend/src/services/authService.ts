import api from './apiClient.ts';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
} from '@/types/api.ts';

export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  me: () => api.get<UserResponse>('/auth/me'),

  refresh: () => api.post<AuthResponse>('/auth/refresh'),
};
