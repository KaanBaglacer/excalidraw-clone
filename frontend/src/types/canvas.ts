export interface AppState {
  viewBackgroundColor: string;
  gridSize: number | null;
}

export const DEFAULT_APP_STATE: AppState = {
  viewBackgroundColor: '#ffffff',
  gridSize: null,
};

export interface Viewport {
  scrollX: number;
  scrollY: number;
  zoom: number;
}
