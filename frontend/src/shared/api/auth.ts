import { apiClient } from './client';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutApi(): Promise<{ message: string }> {
  return apiClient<{ message: string }>('/api/admin/logout', {
    method: 'POST',
  });
}

export async function getMeApi(): Promise<{ user: User }> {
  return apiClient<{ user: User }>('/api/admin/me');
}

