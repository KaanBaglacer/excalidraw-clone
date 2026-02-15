export type ElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'cloud'
  | 'hexagon'
  | 'parallelogram'
  | 'line'
  | 'arrow'
  | 'freedraw'
  | 'text';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'none';
export type FontFamily = 'hand-drawn' | 'normal' | 'code';
export type TextAlign = 'left' | 'center' | 'right';
export type TextType = 'standalone' | 'bound';
export type Arrowhead = 'arrow' | 'triangle' | 'circle' | 'diamond' | null;

export interface Point {
  x: number;
  y: number;
}

export interface PointBinding {
  elementId: string;
  focus: number;
  gap: number;
}

export interface ExcalidrawElementBase {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;

  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;

  roundness: number;
  seed: number;

  index: number;

  isDeleted: boolean;
  version: number;

  link?: string;
  locked?: boolean;
}

export interface ExcalidrawRectangleElement extends ExcalidrawElementBase {
  type: 'rectangle';
}

export interface ExcalidrawEllipseElement extends ExcalidrawElementBase {
  type: 'ellipse';
}

export interface ExcalidrawDiamondElement extends ExcalidrawElementBase {
  type: 'diamond';
}

export interface ExcalidrawCloudElement extends ExcalidrawElementBase {
  type: 'cloud';
}

export interface ExcalidrawHexagonElement extends ExcalidrawElementBase {
  type: 'hexagon';
}

export interface ExcalidrawParallelogramElement extends ExcalidrawElementBase {
  type: 'parallelogram';
}

export interface ExcalidrawLinearElementBase extends ExcalidrawElementBase {
  points: Point[];
  startBinding?: PointBinding | null;
  endBinding?: PointBinding | null;
}

export interface ExcalidrawLineElement extends ExcalidrawLinearElementBase {
  type: 'line';
}

export interface ExcalidrawArrowElement extends ExcalidrawLinearElementBase {
  type: 'arrow';
  startArrowhead: Arrowhead;
  endArrowhead: Arrowhead;
}

export interface ExcalidrawFreedrawElement extends ExcalidrawElementBase {
  type: 'freedraw';
  points: Point[];
  pressures: number[];
}

export interface ExcalidrawTextElement extends ExcalidrawElementBase {
  type: 'text';
  textType: TextType;
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  lineHeight: number;
  baseline?: number;
  containerId?: string | null;
}

export type ExcalidrawElement =
  | ExcalidrawRectangleElement
  | ExcalidrawEllipseElement
  | ExcalidrawDiamondElement
  | ExcalidrawCloudElement
  | ExcalidrawHexagonElement
  | ExcalidrawParallelogramElement
  | ExcalidrawLineElement
  | ExcalidrawArrowElement
  | ExcalidrawFreedrawElement
  | ExcalidrawTextElement;

export interface ElementStyle {
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  roundness: number;
}

export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  strokeColor: '#e0e0e0',
  backgroundColor: 'transparent',
  fillStyle: 'hachure',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  roundness: 0,
};
