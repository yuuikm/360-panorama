import { apiClient } from './client';
import { ApiResponse, Panorama } from '../types';

export async function getPanoramasApi(objectId: number): Promise<ApiResponse<Panorama[]>> {
  return apiClient<ApiResponse<Panorama[]>>(`/api/admin/objects/${objectId}/panoramas`);
}

export async function uploadPanoramaApi(objectId: number, formData: FormData): Promise<ApiResponse<Panorama>> {
  return apiClient<ApiResponse<Panorama>>(`/api/admin/objects/${objectId}/panoramas`, {
    method: 'POST',
    body: formData,
  });
}

export async function getPanoramaApi(id: number): Promise<ApiResponse<Panorama>> {
  return apiClient<ApiResponse<Panorama>>(`/api/admin/panoramas/${id}`);
}

export async function updatePanoramaApi(
  id: number,
  data: FormData | { title?: string; sort_order?: number; status?: string; viewer_type?: 'flat' | '360' }
): Promise<ApiResponse<Panorama>> {
  const isFormData = data instanceof FormData;
  return apiClient<ApiResponse<Panorama>>(`/api/admin/panoramas/${id}`, {
    method: 'POST', // POST with method spoofing / multipart support
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function deletePanoramaApi(id: number): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/admin/panoramas/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderPanoramasApi(
  objectId: number,
  orders: { id: number; sort_order: number }[]
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/admin/objects/${objectId}/panoramas/reorder`, {
    method: 'POST',
    body: JSON.stringify({ orders }),
  });
}

