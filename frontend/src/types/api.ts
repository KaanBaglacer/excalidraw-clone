export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
}

export interface CreateDrawingRequest {
  title: string;
  elements: string;
  appState: string;
}

export interface UpdateDrawingRequest {
  title?: string;
  elements?: string;
  appState?: string;
}

export interface SaveCanvasStateRequest {
  elements: string;
  appState: string;
}

export interface CanvasStateResponse {
  drawingId: string;
  elements: string;
  appState: string;
  updatedAt: string;
}

export interface DrawingResponse {
  id: string;
  title: string;
  ownerId: string;
  elements: string;
  appState: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingListItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  updatedAt: string;
}
