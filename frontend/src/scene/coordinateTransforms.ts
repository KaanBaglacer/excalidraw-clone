import type { Point } from '@/types/element.ts';

export function screenToScene(
  screenX: number,
  screenY: number,
  scrollX: number,
  scrollY: number,
  zoom: number,
): Point {
  return {
    x: screenX / zoom - scrollX,
    y: screenY / zoom - scrollY,
  };
}

export function sceneToScreen(
  sceneX: number,
  sceneY: number,
  scrollX: number,
  scrollY: number,
  zoom: number,
): Point {
  return {
    x: (sceneX + scrollX) * zoom,
    y: (sceneY + scrollY) * zoom,
  };
}
