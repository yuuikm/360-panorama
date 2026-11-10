import { apiClient } from './client';
import { ApiResponse, PublicObject } from '../types';

export async function getPublicObjectApi(publicToken: string): Promise<ApiResponse<PublicObject>> {
  return apiClient<ApiResponse<PublicObject>>(`/api/public/objects/${publicToken}`);
}

