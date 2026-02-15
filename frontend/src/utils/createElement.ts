import type {
  ExcalidrawElement,
  ElementType,
  ElementStyle,
} from '@/types/element.ts';
import { DEFAULT_ELEMENT_STYLE } from '@/types/element.ts';
import { generateId, generateSeed } from './id.ts';

let nextIndex = 0;

export function createElement(
  type: ElementType,
  x: number,
  y: number,
  style: Partial<ElementStyle> = {},
  overrides: Partial<ExcalidrawElement> = {},
): ExcalidrawElement {
  const mergedStyle = { ...DEFAULT_ELEMENT_STYLE, ...style };
  const base = {
    id: generateId(),
    type,
    x,
    y,
    width: 0,
    height: 0,
    angle: 0,
    ...mergedStyle,
    seed: generateSeed(),
    index: nextIndex++,
    isDeleted: false,
    version: 1,
  };

  switch (type) {
    case 'line':
      return {
        ...base,
        type: 'line',
        points: [{ x: 0, y: 0 }],
        ...overrides,
      } as ExcalidrawElement;
    case 'arrow':
      return {
        ...base,
        type: 'arrow',
        points: [{ x: 0, y: 0 }],
        startArrowhead: null,
        endArrowhead: 'arrow',
        ...overrides,
      } as ExcalidrawElement;
    case 'freedraw':
      return {
        ...base,
        type: 'freedraw',
        points: [],
        pressures: [],
        ...overrides,
      } as ExcalidrawElement;
    case 'cloud':
      return {
        ...base,
        type: 'cloud',
        ...overrides,
      } as ExcalidrawElement;
    case 'text':
      return {
        ...base,
        type: 'text',
        textType: 'standalone',
        text: '',
        fontSize: 20,
        fontFamily: 'hand-drawn',
        textAlign: 'left',
        lineHeight: 1.25,
        ...overrides,
      } as ExcalidrawElement;
    default:
      return { ...base, ...overrides } as ExcalidrawElement;
  }
}

export function resetIndexCounter(startFrom: number = 0): void {
  nextIndex = startFrom;
}
