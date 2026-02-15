import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { ExcalidrawElement } from '@/types/element.ts';
import { renderElement } from './renderElement.ts';
import { renderGrid } from './renderGrid.ts';
import { isShapeElement } from '@/utils/collision.ts';

export function renderStaticScene(
  canvas: HTMLCanvasElement,
  rc: RoughCanvas,
  elements: ExcalidrawElement[],
  scrollX: number,
  scrollY: number,
  zoom: number,
  backgroundColor: string,
  gridSize: number | null,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply camera transform
  ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, scrollX * zoom * dpr, scrollY * zoom * dpr);

  // Grid
  if (gridSize) {
    renderGrid(ctx, scrollX, scrollY, zoom, canvas.width / dpr, canvas.height / dpr, gridSize);
  }

  // Render elements sorted by z-index
  const visibleElements = elements
    .filter((el) => !el.isDeleted)
    .sort((a, b) => a.index - b.index);

  for (const element of visibleElements) {
    renderElement(ctx, rc, element);
  }
}

export function renderInteractiveScene(
  canvas: HTMLCanvasElement,
  elements: ExcalidrawElement[],
  selectedElementIds: Set<string>,
  scrollX: number,
  scrollY: number,
  zoom: number,
  selectionBox: { x: number; y: number; width: number; height: number } | null,
  connectorPreview?: { fromX: number; fromY: number; toX: number; toY: number } | null,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply camera transform
  ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, scrollX * zoom * dpr, scrollY * zoom * dpr);

  // Render selection for each selected element
  if (selectedElementIds.size > 0) {
    const selectedElements = elements.filter(
      (el) => selectedElementIds.has(el.id) && !el.isDeleted,
    );

    for (const element of selectedElements) {
      renderElementSelection(ctx, element);
    }

    // Render resize handles for single selection
    if (selectedElements.length === 1) {
      const selected = selectedElements[0];
      if (isShapeElement(selected)) {
        renderResizeHandles(ctx, selected);
        renderRotationHandle(ctx, selected);
      }
    } else if (selectedElements.length > 1) {
      // Render group bounding box
      renderGroupBounds(ctx, selectedElements);
    }
  }

  // Render marquee selection box
  if (selectionBox) {
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.beginPath();
    ctx.rect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Render connector preview line
  if (connectorPreview) {
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.moveTo(connectorPreview.fromX, connectorPreview.fromY);
    ctx.lineTo(connectorPreview.toX, connectorPreview.toY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrowhead at end
    const angle = Math.atan2(
      connectorPreview.toY - connectorPreview.fromY,
      connectorPreview.toX - connectorPreview.fromX,
    );
    const headLen = 12 / zoom;
    ctx.beginPath();
    ctx.moveTo(
      connectorPreview.toX - headLen * Math.cos(angle - Math.PI / 6),
      connectorPreview.toY - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(connectorPreview.toX, connectorPreview.toY);
    ctx.lineTo(
      connectorPreview.toX - headLen * Math.cos(angle + Math.PI / 6),
      connectorPreview.toY - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.stroke();
    ctx.restore();
  }

  // Render link indicators
  for (const element of elements) {
    if (element.isDeleted || !element.link) continue;
    renderLinkIndicator(ctx, element, zoom);
  }
}

function renderLinkIndicator(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
  zoom: number,
): void {
  const iconSize = 14 / zoom;
  const margin = 4 / zoom;
  const ix = element.x + element.width - iconSize - margin;
  const iy = element.y + margin;

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.5 / zoom;
  ctx.lineCap = 'round';

  // Draw a small chain-link icon (two interlocking ovals)
  const r = iconSize / 4;
  const cx1 = ix + iconSize / 3;
  const cx2 = ix + (iconSize * 2) / 3;
  const cy = iy + iconSize / 2;

  ctx.beginPath();
  ctx.ellipse(cx1, cy, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx2, cy, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function renderElementSelection(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
): void {
  ctx.save();

  const padding = 4;

  if (element.angle !== 0) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(element.angle);
    ctx.translate(-cx, -cy);
  }

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.strokeRect(
    element.x - padding,
    element.y - padding,
    element.width + padding * 2,
    element.height + padding * 2,
  );

  ctx.restore();
}

const HANDLE_SIZE = 8;

function renderResizeHandles(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
): void {
  ctx.save();

  const padding = 4;

  if (element.angle !== 0) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(element.angle);
    ctx.translate(-cx, -cy);
  }

  const x = element.x - padding;
  const y = element.y - padding;
  const w = element.width + padding * 2;
  const h = element.height + padding * 2;
  const half = HANDLE_SIZE / 2;

  const handles = [
    { x: x - half, y: y - half },                     // nw
    { x: x + w / 2 - half, y: y - half },             // n
    { x: x + w - half, y: y - half },                 // ne
    { x: x + w - half, y: y + h / 2 - half },         // e
    { x: x + w - half, y: y + h - half },             // se
    { x: x + w / 2 - half, y: y + h - half },         // s
    { x: x - half, y: y + h - half },                 // sw
    { x: x - half, y: y + h / 2 - half },             // w
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.5;

  for (const handle of handles) {
    ctx.beginPath();
    ctx.rect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function renderRotationHandle(
  ctx: CanvasRenderingContext2D,
  element: ExcalidrawElement,
): void {
  ctx.save();

  const padding = 4;
  const rotHandleOffset = 24;

  if (element.angle !== 0) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(element.angle);
    ctx.translate(-cx, -cy);
  }

  const handleX = element.x + element.width / 2;
  const handleY = element.y - padding - rotHandleOffset;

  // Connecting line
  ctx.beginPath();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1;
  ctx.moveTo(handleX, element.y - padding);
  ctx.lineTo(handleX, handleY);
  ctx.stroke();

  // Circle handle
  ctx.beginPath();
  ctx.arc(handleX, handleY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function renderGroupBounds(
  ctx: CanvasRenderingContext2D,
  elements: ExcalidrawElement[],
): void {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  const padding = 6;
  ctx.save();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(
    minX - padding,
    minY - padding,
    maxX - minX + padding * 2,
    maxY - minY + padding * 2,
  );
  ctx.setLineDash([]);
  ctx.restore();
}
