import type { ExcalidrawElement, ExcalidrawLinearElementBase } from '@/types/element.ts';
import { getShapeBoundaryPoint } from '@/utils/geometry.ts';
import { getLinearEndpoints, isArrowElement, offsetPointFromCenter } from './canvasGeometry.ts';

export function computeLinearBoundPoints(
  linear: ExcalidrawLinearElementBase,
  sourceEl: ExcalidrawElement | null,
  targetEl: ExcalidrawElement | null,
) {
  const endpoints = getLinearEndpoints(linear);
  let startPt = { x: endpoints.startX, y: endpoints.startY };
  let endPt = { x: endpoints.endX, y: endpoints.endY };

  if (sourceEl && targetEl) {
    const sCx = sourceEl.x + sourceEl.width / 2;
    const sCy = sourceEl.y + sourceEl.height / 2;
    const tCx = targetEl.x + targetEl.width / 2;
    const tCy = targetEl.y + targetEl.height / 2;
    startPt = getShapeBoundaryPoint(sourceEl, tCx, tCy);
    endPt = getShapeBoundaryPoint(targetEl, sCx, sCy);
    if (isArrowElement(linear) && linear.endArrowhead) {
      endPt = offsetPointFromCenter(endPt, tCx, tCy, Math.max(2, linear.strokeWidth));
    }
    return { startPt, endPt };
  }

  if (sourceEl) {
    startPt = getShapeBoundaryPoint(sourceEl, endPt.x, endPt.y);
    return { startPt, endPt };
  }

  if (targetEl) {
    endPt = getShapeBoundaryPoint(targetEl, startPt.x, startPt.y);
    if (isArrowElement(linear) && linear.endArrowhead) {
      const tCx = targetEl.x + targetEl.width / 2;
      const tCy = targetEl.y + targetEl.height / 2;
      endPt = offsetPointFromCenter(endPt, tCx, tCy, Math.max(2, linear.strokeWidth));
    }
  }

  return { startPt, endPt };
}
