import type { ExcalidrawElement, ExcalidrawLinearElementBase, Point } from '@/types/element.ts';
import { distanceToSegment } from './math.ts';

const LINE_HIT_THRESHOLD = 10;

export function isPointInElement(
    x: number,
    y: number,
    element: ExcalidrawElement,
): boolean {
    if (element.isDeleted) return false;

    const { x: ex, y: ey, width, height } = element;

    if (element.type === 'line' || element.type === 'arrow') {
        const linear = element as ExcalidrawLinearElementBase;
        if (linear.points.length < 2) return false;

        // Check distance to each segment
        for (let i = 0; i < linear.points.length - 1; i++) {
            const a: Point = {
                x: ex + linear.points[i].x,
                y: ey + linear.points[i].y,
            };
            const b: Point = {
                x: ex + linear.points[i + 1].x,
                y: ey + linear.points[i + 1].y,
            };
            if (distanceToSegment({ x, y }, a, b) < LINE_HIT_THRESHOLD) {
                return true;
            }
        }
        return false;
    }

    if (element.type === 'freedraw') {
        // Use a generous bounding box for freedraw
        const padding = LINE_HIT_THRESHOLD;
        return (
            x >= ex - padding &&
            x <= ex + width + padding &&
            y >= ey - padding &&
            y <= ey + height + padding
        );
    }

    // Rectangle, Diamond, Ellipse, Cloud, Hexagon, Parallelogram, Text
    return x >= ex && x <= ex + width && y >= ey && y <= ey + height;
}

export function getElementAtPosition(
    elements: ExcalidrawElement[],
    x: number,
    y: number,
): ExcalidrawElement | null {
    // Sort by z-index descending and find first hit
    const sorted = [...elements]
        .filter((el) => !el.isDeleted)
        .sort((a, b) => b.index - a.index);

    for (const element of sorted) {
        if (isPointInElement(x, y, element)) {
            return element;
        }
    }
    return null;
}

export function getElementsInRect(
    elements: ExcalidrawElement[],
    rx: number,
    ry: number,
    rw: number,
    rh: number,
): ExcalidrawElement[] {
    // Normalize rect (handle negative width/height)
    const minX = Math.min(rx, rx + rw);
    const minY = Math.min(ry, ry + rh);
    const maxX = Math.max(rx, rx + rw);
    const maxY = Math.max(ry, ry + rh);

    return elements.filter((el) => {
        if (el.isDeleted) return false;
        // Element must be fully contained in selection rect
        return (
            el.x >= minX &&
            el.y >= minY &&
            el.x + el.width <= maxX &&
            el.y + el.height <= maxY
        );
    });
}

const SHAPE_TYPES = new Set([
    'rectangle', 'ellipse', 'diamond', 'cloud', 'hexagon', 'parallelogram', 'line', 'arrow',
]);

export function isShapeElement(element: ExcalidrawElement): boolean {
    return SHAPE_TYPES.has(element.type);
}
