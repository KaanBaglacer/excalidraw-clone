import type { ExcalidrawElement, ExcalidrawTextElement } from '@/types/element.ts';
import { measureText, wrapText } from '@/utils/text.ts';
import { TEXT_CONTAINER_PADDING } from './canvasGeometry.ts';

export function findTextById(
  elements: ExcalidrawElement[],
  id: string | null,
): ExcalidrawTextElement | null {
  if (!id) return null;
  const element = elements.find((el) => el.id === id);
  return element?.type === 'text' ? element : null;
}

export function buildSubmittedTextUpdate(
  element: ExcalidrawTextElement,
  allElements: ExcalidrawElement[],
  text: string,
) {
  let finalText = text;
  if (element.containerId) {
    const container = allElements.find((el) => el.id === element.containerId);
    if (container) {
      const maxWidth = Math.max(1, container.width - TEXT_CONTAINER_PADDING);
      finalText = wrapText(text, maxWidth, element.fontSize, element.fontFamily);
    }
  }

  const { width, height, baseline } = measureText(finalText, element.fontSize, element.fontFamily);
  const updates: Partial<ExcalidrawElement> = {
    text: finalText,
    width,
    height,
    baseline,
  };

  if (element.containerId) {
    const container = allElements.find((el) => el.id === element.containerId);
    if (container) {
      updates.x = container.x + container.width / 2 - width / 2;
      updates.y = container.y + container.height / 2 - height / 2;
    }
  }

  return updates;
}
