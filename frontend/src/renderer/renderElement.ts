import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Options, Drawable } from 'roughjs/bin/core';
import type { ExcalidrawElement } from '@/types/element.ts';
import { getCachedDrawable, setCachedDrawable } from './shapeCache.ts';

const FONT_FAMILY_MAP: Record<string, string> = {
  'hand-drawn': '"Virgil", "Segoe UI", sans-serif',
  normal: '"Helvetica", "Arial", sans-serif',
  code: '"Cascadia Code", "Fira Code", monospace',
};

function buildRoughOptions(element: ExcalidrawElement): Options {
  const hasFill =
    element.backgroundColor !== 'transparent' &&
    element.type !== 'line' &&
    element.type !== 'arrow' &&
    element.type !== 'freedraw';

  return {
    seed: element.seed,
    roughness: element.roughness,
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    fill: hasFill ? element.backgroundColor : undefined,
    fillStyle: element.fillStyle === 'none' ? undefined : element.fillStyle,
    strokeLineDash:
      element.strokeStyle === 'dashed'
        ? [12, 8]
        : element.strokeStyle === 'dotted'
          ? [3, 6]
          : undefined,
  };
}

function generateDrawable(
  element: ExcalidrawElement,
  rc: RoughCanvas,
): Drawable | null {
  const options = buildRoughOptions(element);

  switch (element.type) {
    case 'rectangle': {
      if (element.roundness > 0) {
        const r = Math.min(
          element.roundness,
          element.width / 2,
          element.height / 2,
        );
        const w = element.width;
        const h = element.height;
        const d = `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
        return rc.generator.path(d, options);
      }
      return rc.generator.rectangle(0, 0, element.width, element.height, options);
    }
    case 'ellipse':
      return rc.generator.ellipse(
        element.width / 2,
        element.height / 2,
        element.width,
        element.height,
        options,
      );
    case 'diamond': {
      const w = element.width;
      const h = element.height;
      return rc.generator.polygon(
        [
          [w / 2, 0],
          [w, h / 2],
          [w / 2, h],
          [0, h / 2],
        ],
        options,
      );
    }
    case 'line':
      if (element.points.length >= 2) {
        return rc.generator.linearPath(
          element.points.map((p) => [p.x, p.y] as [number, number]),
          options,
        );
      }
      return null;
    case 'arrow':
      if (element.points.length >= 2) {
        return rc.generator.linearPath(
          element.points.map((p) => [p.x, p.y] as [number, number]),
          options,
        );
      }
      return null;
    case 'hexagon': {
      const w = element.width;
      const h = element.height;
      return rc.generator.polygon(
        [
          [w * 0.25, 0],
          [w * 0.75, 0],
          [w, h * 0.5],
          [w * 0.75, h],
          [w * 0.25, h],
          [0, h * 0.5],
        ],
        options,
      );
    }
    case 'parallelogram': {
      const w = element.width;
      const h = element.height;
      const skew = w * 0.2;
      return rc.generator.polygon(
        [
          [skew, 0],
          [w, 0],
          [w - skew, h],
          [0, h],
        ],
        options,
      );
    }
    case 'cloud': {
      const w = element.width;
      const h = element.height;
      // Simple 4-bump cloud approximation
      // M 0 h/2 C 0 0, w/2 0, w/2 h/2 C w/2 0, w 0, w h/2 C w h, w/2 h, w/2 h/2 C w/2 h, 0 h, 0 h/2
      // A better cloud might use arcs.
      // For roughjs to look good, a path is best.
      // Let's do a simple path that looks like a cloud.
      const d = `M ${w * 0.2} ${h * 0.5} 
                   C ${w * 0.2} ${h * 0.2}, ${w * 0.4} ${h * 0.0}, ${w * 0.5} ${h * 0.3}
                   C ${w * 0.6} ${h * 0.0}, ${w * 0.9} ${h * 0.2}, ${w * 0.9} ${h * 0.5}
                   C ${w * 1.0} ${h * 0.6}, ${w * 0.9} ${h * 0.9}, ${w * 0.7} ${h * 0.9}
                   C ${w * 0.6} ${h * 1.0}, ${w * 0.3} ${h * 1.0}, ${w * 0.2} ${h * 0.9}
                   C ${w * 0.0} ${h * 0.8}, ${w * 0.0} ${h * 0.5}, ${w * 0.2} ${h * 0.5} Z`;

      return rc.generator.path(d, options);
    }
    default:
      return null;
  }
}

function getOrCreateDrawable(
  element: ExcalidrawElement,
  rc: RoughCanvas,
): Drawable | null {
  const cached = getCachedDrawable(element.id, element.version);
  if (cached) return cached;

  const drawable = generateDrawable(element, rc);
  if (drawable) {
    setCachedDrawable(element.id, element.version, drawable);
  }
  return drawable;
}

function renderArrowhead(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
): void {
  if (element.type !== 'arrow') return;
  if (element.points.length < 2) return;

  const points = element.points;

  if (element.endArrowhead) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
    const headLen = Math.max(10, element.strokeWidth * 4);

    ctx.beginPath();
    ctx.moveTo(
      last.x - headLen * Math.cos(angle - Math.PI / 6),
      last.y - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(last.x, last.y);
    ctx.lineTo(
      last.x - headLen * Math.cos(angle + Math.PI / 6),
      last.y - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.strokeStyle = element.strokeColor;
    ctx.lineWidth = element.strokeWidth;
    ctx.stroke();
  }

  if (element.startArrowhead) {
    const first = points[0];
    const next = points[1];
    const angle = Math.atan2(first.y - next.y, first.x - next.x);
    const headLen = Math.max(10, element.strokeWidth * 4);

    ctx.beginPath();
    ctx.moveTo(
      first.x - headLen * Math.cos(angle - Math.PI / 6),
      first.y - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(first.x, first.y);
    ctx.lineTo(
      first.x - headLen * Math.cos(angle + Math.PI / 6),
      first.y - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.strokeStyle = element.strokeColor;
    ctx.lineWidth = element.strokeWidth;
    ctx.stroke();
  }
}

function renderFreedraw(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
): void {
  if (element.type !== 'freedraw') return;
  if (element.points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(element.points[0].x, element.points[0].y);

  for (let i = 1; i < element.points.length - 1; i++) {
    const curr = element.points[i];
    const next = element.points[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }

  const last = element.points[element.points.length - 1];
  ctx.lineTo(last.x, last.y);

  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (element.strokeStyle === 'dashed') {
    ctx.setLineDash([12, 8]);
  } else if (element.strokeStyle === 'dotted') {
    ctx.setLineDash([3, 6]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

function renderText(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
): void {
  if (element.type !== 'text') return;
  if (!element.text) return;

  const fontFamily = FONT_FAMILY_MAP[element.fontFamily] || FONT_FAMILY_MAP.normal;
  ctx.font = `${element.fontSize}px ${fontFamily}`;
  ctx.fillStyle = element.strokeColor;
  ctx.textBaseline = 'top';
  ctx.textAlign = element.textAlign;

  const lines = element.text.split('\n');
  const lineHeightPx = element.fontSize * element.lineHeight;
  let textX = 0;
  if (element.textAlign === 'center') {
    textX = element.width / 2;
  } else if (element.textAlign === 'right') {
    textX = element.width;
  }

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], textX, i * lineHeightPx);
  }
}

export function renderElement(
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  element: ExcalidrawElement,
): void {
  if (element.isDeleted) return;

  ctx.save();

  ctx.translate(element.x, element.y);

  if (element.angle !== 0) {
    const cx = element.width / 2;
    const cy = element.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(element.angle);
    ctx.translate(-cx, -cy);
  }

  ctx.globalAlpha = element.opacity / 100;

  switch (element.type) {
    case 'rectangle':
    case 'ellipse':
    case 'diamond':
    case 'hexagon':
    case 'parallelogram':
    case 'line':
    case 'arrow': {
      const drawable = getOrCreateDrawable(element, rc);
      if (drawable) {
        rc.draw(drawable);
      }
      if (element.type === 'arrow') {
        renderArrowhead(ctx, element);
      }
      break;
    }
    case 'freedraw':
      renderFreedraw(ctx, element);
      break;
    case 'text':
      renderText(ctx, element);
      break;
    case 'cloud': {
      const drawable = getOrCreateDrawable(element, rc);
      if (drawable) {
        rc.draw(drawable);
      }
      break;
    }
  }

  ctx.restore();
}
