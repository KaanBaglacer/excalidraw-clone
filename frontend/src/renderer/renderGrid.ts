export function renderGrid(
  ctx: CanvasRenderingContext2D,
  scrollX: number,
  scrollY: number,
  _zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number,
): void {
  ctx.save();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 0.5;

  const startX = Math.floor(-scrollX / gridSize) * gridSize;
  const startY = Math.floor(-scrollY / gridSize) * gridSize;
  const endX = startX + canvasWidth / _zoom + gridSize;
  const endY = startY + canvasHeight / _zoom + gridSize;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  ctx.restore();
}
