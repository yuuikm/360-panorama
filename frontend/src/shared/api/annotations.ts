import { apiClient } from './client';
import { Annotation, ApiResponse } from '../types';

export async function getAnnotationsApi(panoramaId: number): Promise<ApiResponse<Annotation[]>> {
  return apiClient<ApiResponse<Annotation[]>>(`/api/admin/panoramas/${panoramaId}/annotations`);
}

export async function createAnnotationApi(
  panoramaId: number,
  data: Partial<Annotation>
): Promise<ApiResponse<Annotation>> {
  return apiClient<ApiResponse<Annotation>>(`/api/admin/panoramas/${panoramaId}/annotations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAnnotationApi(
  id: number,
  data: Partial<Annotation>
): Promise<ApiResponse<Annotation>> {
  return apiClient<ApiResponse<Annotation>>(`/api/admin/annotations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAnnotationApi(id: number): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/admin/annotations/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderAnnotationsApi(
  panoramaId: number,
  orders: { id: number; sort_order: number }[]
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/admin/panoramas/${panoramaId}/annotations/reorder`, {
    method: 'POST',
    body: JSON.stringify({ orders }),
  });
}

