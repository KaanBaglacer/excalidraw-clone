import { useRef, useEffect, useCallback } from 'react';

export function useCanvas() {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactiveCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resizeCanvases = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    for (const canvas of [staticCanvasRef.current, interactiveCanvasRef.current]) {
      if (canvas) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvases();

    const observer = new ResizeObserver(() => resizeCanvases());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [resizeCanvases]);

  return { staticCanvasRef, interactiveCanvasRef, containerRef };
}
