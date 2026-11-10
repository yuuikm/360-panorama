import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, PanoramaObject, PublishResult } from '../types';

export interface GetObjectsParams {
  status?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export async function getObjectsApi(params?: GetObjectsParams): Promise<PaginatedResponse<PanoramaObject>> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.per_page) query.append('per_page', params.per_page.toString());
  if (params?.page) query.append('page', params.page.toString());

  const qs = query.toString();
  return apiClient<PaginatedResponse<PanoramaObject>>(`/api/admin/objects${qs ? `?${qs}` : ''}`);
}

export async function getObjectApi(id: number): Promise<ApiResponse<PanoramaObject>> {
  return apiClient<ApiResponse<PanoramaObject>>(`/api/admin/objects/${id}`);
}

export async function createObjectApi(data: {
  title: string;
  description?: string;
  status?: string;
}): Promise<ApiResponse<PanoramaObject>> {
  return apiClient<ApiResponse<PanoramaObject>>('/api/admin/objects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateObjectApi(
  id: number,
  data: Partial<{ title: string; description: string; status: string }>
): Promise<ApiResponse<PanoramaObject>> {
  return apiClient<ApiResponse<PanoramaObject>>(`/api/admin/objects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteObjectApi(id: number): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/admin/objects/${id}`, {
    method: 'DELETE',
  });
}

export async function publishObjectApi(id: number): Promise<PublishResult> {
  return apiClient<PublishResult>(`/api/admin/objects/${id}/publish`, {
    method: 'POST',
  });
}

export async function unpublishObjectApi(id: number): Promise<{ message: string; object: PanoramaObject }> {
  return apiClient<{ message: string; object: PanoramaObject }>(`/api/admin/objects/${id}/unpublish`, {
    method: 'POST',
  });
}

export async function regenerateTokenApi(id: number): Promise<PublishResult> {
  return apiClient<PublishResult>(`/api/admin/objects/${id}/regenerate-token`, {
    method: 'POST',
  });
}

export function getQrDownloadUrl(id: number, token: string): string {
  return `/api/admin/objects/${id}/qr?token=${encodeURIComponent(token)}`;
}

