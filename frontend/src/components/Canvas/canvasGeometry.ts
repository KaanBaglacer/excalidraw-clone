import type {
  ExcalidrawArrowElement,
  ExcalidrawElement,
  ExcalidrawLinearElementBase,
  ExcalidrawTextElement,
  FontFamily,
} from '@/types/element.ts';
import { isShapeElement } from '@/utils/collision.ts';
import { measureText } from '@/utils/text.ts';

const SELECTION_PADDING = 4;
const RESIZE_HANDLE_SIZE = 8;
const MIN_TEXT_SAMPLE = 'W';

export const MIN_RESIZE_SIZE = 8;
export const TEXT_CONTAINER_PADDING = 20;

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function getCursorForTool(tool: string): string {
  switch (tool) {
    case 'hand': return 'grab';
    case 'select': return 'default';
    case 'eraser': return 'crosshair';
    default: return 'crosshair';
  }
}

export function isResizableElement(element: ExcalidrawElement): boolean {
  return isShapeElement(element) && element.type !== 'line' && element.type !== 'arrow';
}

export function getCursorForResizeHandle(handle: ResizeHandle): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    default:
      return 'default';
  }
}

export function getResizeHandleAtPoint(
  element: ExcalidrawElement,
  x: number,
  y: number,
): ResizeHandle | null {
  const half = RESIZE_HANDLE_SIZE / 2;
  const bx = element.x - SELECTION_PADDING;
  const by = element.y - SELECTION_PADDING;
  const bw = element.width + SELECTION_PADDING * 2;
  const bh = element.height + SELECTION_PADDING * 2;

  const handles: Array<{ key: ResizeHandle; x: number; y: number }> = [
    { key: 'nw', x: bx, y: by },
    { key: 'n', x: bx + bw / 2, y: by },
    { key: 'ne', x: bx + bw, y: by },
    { key: 'e', x: bx + bw, y: by + bh / 2 },
    { key: 'se', x: bx + bw, y: by + bh },
    { key: 's', x: bx + bw / 2, y: by + bh },
    { key: 'sw', x: bx, y: by + bh },
    { key: 'w', x: bx, y: by + bh / 2 },
  ];

  for (const handle of handles) {
    if (
      x >= handle.x - half &&
      x <= handle.x + half &&
      y >= handle.y - half &&
      y <= handle.y + half
    ) {
      return handle.key;
    }
  }

  return null;
}

export function getNormalizedLinearGeometry(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const minX = Math.min(startX, endX);
  const minY = Math.min(startY, endY);
  return {
    x: minX,
    y: minY,
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
    points: [
      { x: startX - minX, y: startY - minY },
      { x: endX - minX, y: endY - minY },
    ],
  };
}

export function getLinearEndpoints(element: ExcalidrawLinearElementBase) {
  const first = element.points[0];
  const last = element.points[element.points.length - 1] ?? first;
  return {
    startX: element.x + first.x,
    startY: element.y + first.y,
    endX: element.x + last.x,
    endY: element.y + last.y,
  };
}

export function offsetPointFromCenter(
  point: { x: number; y: number },
  centerX: number,
  centerY: number,
  distance: number,
) {
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return point;
  return {
    x: point.x + (dx / len) * distance,
    y: point.y + (dy / len) * distance,
  };
}

export function isArrowElement(linear: ExcalidrawLinearElementBase): linear is ExcalidrawArrowElement {
  return linear.type === 'arrow';
}

export function isTextElement(element: ExcalidrawElement): element is ExcalidrawTextElement {
  return element.type === 'text';
}

export function getMinTextBoxSize(
  fontSize = 20,
  fontFamily: FontFamily = 'hand-drawn',
) {
  const { width, height } = measureText(MIN_TEXT_SAMPLE, fontSize, fontFamily);
  return { minWidth: width, minHeight: height };
}
