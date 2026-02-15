import type { Point } from './element.ts';

export type ToolType =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'hexagon'
  | 'parallelogram'
  | 'line'
  | 'arrow'
  | 'freedraw'
  | 'text'
  | 'cloud'
  | 'eraser'
  | 'hand';

export interface CanvasPointerEvent {
  nativeEvent: PointerEvent;
  scenePoint: Point;
}

export interface Tool {
  type: ToolType;
  cursor: string;
  onPointerDown(event: CanvasPointerEvent): void;
  onPointerMove(event: CanvasPointerEvent): void;
  onPointerUp(event: CanvasPointerEvent): void;
  onKeyDown?(event: KeyboardEvent): void;
}
