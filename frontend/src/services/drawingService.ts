import api from './apiClient.ts';
import type {
  CreateDrawingRequest,
  UpdateDrawingRequest,
  SaveCanvasStateRequest,
  DrawingResponse,
  DrawingListItem,
  CanvasStateResponse,
} from '@/types/api.ts';

export const drawingService = {
  list: () => api.get<DrawingListItem[]>('/drawings'),

  get: (id: string) => api.get<DrawingResponse>(`/drawings/${id}`),

  create: (data: CreateDrawingRequest) =>
    api.post<DrawingResponse>('/drawings', data),

  update: (id: string, data: UpdateDrawingRequest) =>
    api.put<DrawingResponse>(`/drawings/${id}`, data),

  saveState: (id: string, data: SaveCanvasStateRequest) =>
    api.put<CanvasStateResponse>(`/drawings/${id}/state`, data),

  delete: (id: string) => api.delete(`/drawings/${id}`),
};
