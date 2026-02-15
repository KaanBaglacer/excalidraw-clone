import { useCallback, useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { ExcalidrawElement, ExcalidrawLinearElementBase, ExcalidrawTextElement } from '@/types/element.ts';
import { useCanvas } from '@/hooks/useCanvas.ts';
import { useCanvasStore } from '@/store/canvasStore.ts';
import { renderStaticScene, renderInteractiveScene } from '@/renderer/renderScene.ts';
import { createElement } from '@/utils/createElement.ts';
import { getElementAtPosition, getElementsInRect, isShapeElement } from '@/utils/collision.ts';
import { useUIStore } from '@/store/uiStore.ts';
import { LinkDialog } from './LinkDialog.tsx';
import { TextEditorOverlay } from './TextEditorOverlay.tsx';
import { computeLinearBoundPoints } from './linearBindings.ts';
import { buildSubmittedTextUpdate, findTextById } from './textService.ts';
import { useCanvasKeyboardShortcuts } from './useCanvasKeyboardShortcuts.ts';
import {
  getCursorForResizeHandle,
  getCursorForTool,
  getLinearEndpoints,
  getMinTextBoxSize,
  getNormalizedLinearGeometry,
  getResizeHandleAtPoint,
  isResizableElement,
  isTextElement,
  MIN_RESIZE_SIZE,
  offsetPointFromCenter,
  type ResizeHandle,
  TEXT_CONTAINER_PADDING,
} from './canvasGeometry.ts';
import { getShapeBoundaryPoint } from '@/utils/geometry.ts';
import { measureText, wrapText } from '@/utils/text.ts';
import { useHistoryStore } from '@/store/historyStore.ts';
import { DEFAULT_APP_STATE } from '@/types/canvas.ts';



export function Canvas() {
  const { staticCanvasRef, interactiveCanvasRef, containerRef } = useCanvas();
  const roughCanvasRef = useRef<RoughCanvas | null>(null);
  const lastNonceRef = useRef(-1);

  // Store selectors
  const elements = useCanvasStore((s) => s.elements);
  const selectedElementIds = useCanvasStore((s) => s.selectedElementIds);
  const scrollX = useCanvasStore((s) => s.scrollX);
  const scrollY = useCanvasStore((s) => s.scrollY);
  const zoom = useCanvasStore((s) => s.zoom);
  const sceneNonce = useCanvasStore((s) => s.sceneNonce);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const currentStyle = useCanvasStore((s) => s.currentStyle);

  // Store actions (stable references via getState in handlers)
  const addElement = useCanvasStore((s) => s.addElement);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const deleteElements = useCanvasStore((s) => s.deleteElements);
  const setSelectedElementIds = useCanvasStore((s) => s.setSelectedElementIds);
  const replaceElements = useCanvasStore((s) => s.replaceElements);

  // History Actions
  const pushHistoryEntry = useHistoryStore((s) => s.pushEntry);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const saveHistory = useCallback(() => {
    const state = useCanvasStore.getState();
    pushHistoryEntry({
      elements: state.elements,
      appState: DEFAULT_APP_STATE, // Placeholder until appState is fully implemented
    });
  }, [pushHistoryEntry]);

  // Initial history entry
  useEffect(() => {
    // Push initial state (empty or loaded)
    saveHistory();
  }, [saveHistory]); // Run once on mount

  // ── Drawing refs ───────────────────────────────────────────────────────
  const isDraggingRef = useRef(false);
  const drawingElementIdRef = useRef<string | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  // ── Select / Move refs ─────────────────────────────────────────────────
  const isDraggingSelectionRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const initialBoundTextPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const selectionBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const isMarqueeRef = useRef(false);
  const isResizingSelectionRef = useRef(false);
  const resizeHandleRef = useRef<ResizeHandle | null>(null);
  const resizeTargetIdRef = useRef<string | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeInitialBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // ── Pan refs ───────────────────────────────────────────────────────────
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // ── Eraser refs ────────────────────────────────────────────────────────
  const isErasingRef = useRef(false);
  const erasedIdsRef = useRef(new Set<string>());

  // ── Connector refs (Phase 5 prep) ─────────────────────────────────────
  const connectorSourceRef = useRef<string | null>(null);
  const [connectorPreview, setConnectorPreview] = useState<{ fromX: number; fromY: number; toX: number; toY: number } | null>(null);
  const clearConnectorPreview = useCallback(() => {
    connectorSourceRef.current = null;
    setConnectorPreview(null);
  }, []);

  // ── Text editing state (Phase 4 prep) ─────────────────────────────────
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // ── Cursor state ───────────────────────────────────────────────────────
  const [cursor, setCursor] = useState('default');

  useCanvasKeyboardShortcuts({
    redo,
    undo,
    replaceElements,
    saveHistory,
    clearConnectorPreview,
  });

  // ── Scene-point conversion ─────────────────────────────────────────────
  const getScenePoint = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const { left, top } = containerRef.current.getBoundingClientRect();
    const state = useCanvasStore.getState();
    return {
      x: (e.clientX - left) / state.zoom - state.scrollX,
      y: (e.clientY - top) / state.zoom - state.scrollY,
    };
  }, [containerRef]);

  // ══════════════════════════════════════════════════════════════════════
  //  POINTER DOWN
  // ══════════════════════════════════════════════════════════════════════
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const state = useCanvasStore.getState();
    const { x, y } = getScenePoint(e);
    if (state.activeTool !== 'arrow' && connectorSourceRef.current) {
      connectorSourceRef.current = null;
      setConnectorPreview(null);
    }

    // ── Middle mouse → always pan ────────────────────────────────────
    if (e.button === 1) {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      isPanningRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      setCursor('grabbing');
      return;
    }

    // ── Hand tool → pan ──────────────────────────────────────────────
    if (state.activeTool === 'hand') {
      (e.target as Element).setPointerCapture(e.pointerId);
      isPanningRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      setCursor('grabbing');
      return;
    }

    // ── Eraser tool ──────────────────────────────────────────────────
    if (state.activeTool === 'eraser') {
      (e.target as Element).setPointerCapture(e.pointerId);
      isErasingRef.current = true;
      erasedIdsRef.current = new Set();
      let hit = getElementAtPosition(state.elements, x, y);
      if (hit && isTextElement(hit) && hit.textType === 'bound' && hit.containerId) {
        const containerId = hit.containerId;
        const container = state.elements.find((el) => el.id === containerId && !el.isDeleted);
        if (container) {
          hit = container;
        }
      }
      if (hit) {
        deleteElements([hit.id]);
        erasedIdsRef.current.add(hit.id);
      }
      return;
    }

    // ── Select tool ──────────────────────────────────────────────────
    if (state.activeTool === 'select') {
      (e.target as Element).setPointerCapture(e.pointerId);

      // Single-selection resize handles
      if (state.selectedElementIds.size === 1) {
        const selectedId = [...state.selectedElementIds][0];
        const selectedEl = state.elements.find((el) => el.id === selectedId && !el.isDeleted);
        if (selectedEl && isResizableElement(selectedEl)) {
          const resizeHandle = getResizeHandleAtPoint(selectedEl, x, y);
          if (resizeHandle) {
              isResizingSelectionRef.current = true;
              resizeHandleRef.current = resizeHandle;
              resizeTargetIdRef.current = selectedEl.id;
              resizeStartRef.current = { x, y };
              resizeInitialBoundsRef.current = {
                x: selectedEl.x,
                y: selectedEl.y,
                width: selectedEl.width,
                height: selectedEl.height,
              };
              setCursor(getCursorForResizeHandle(resizeHandle));
              return;
            }
        }
      }

      const rawHit = getElementAtPosition(state.elements, x, y);
      const hit =
        rawHit && isTextElement(rawHit) && rawHit.textType === 'bound' && rawHit.containerId
          ? state.elements.find((el) => el.id === rawHit.containerId && !el.isDeleted) ?? rawHit
          : rawHit;

      // Ctrl+Click → navigate to linked element
      if (hit && (e.ctrlKey || e.metaKey) && hit.link?.startsWith('element://')) {
        const targetId = hit.link.slice(10);
        const target = state.elements.find((el) => el.id === targetId && !el.isDeleted);
        if (target) {
          const container = containerRef.current;
          if (container) {
            const { width, height } = container.getBoundingClientRect();
            const targetCx = target.x + target.width / 2;
            const targetCy = target.y + target.height / 2;
            state.setScroll(-targetCx + width / (2 * state.zoom), -targetCy + height / (2 * state.zoom));
            state.setSelectedElementIds(new Set([targetId]));
          }
        }
        return;
      }

      if (hit) {
        // Clicked on an element
        if (e.shiftKey) {
          // Toggle in selection
          const next = new Set(state.selectedElementIds);
          if (next.has(hit.id)) {
            next.delete(hit.id);
          } else {
            next.add(hit.id);
          }
          setSelectedElementIds(next);
        } else if (!state.selectedElementIds.has(hit.id)) {
          setSelectedElementIds(new Set([hit.id]));
        }
        // else: already selected, keep for potential drag

        // Prepare drag
        isDraggingSelectionRef.current = true;
        dragStartRef.current = { x, y };
        const currentSelection = e.shiftKey
          ? useCanvasStore.getState().selectedElementIds
          : state.selectedElementIds.has(hit.id)
            ? state.selectedElementIds
            : new Set([hit.id]);

        const positions = new Map<string, { x: number; y: number }>();
        for (const id of currentSelection) {
          const el = state.elements.find((elem) => elem.id === id);
          if (el) positions.set(id, { x: el.x, y: el.y });
        }
        initialPositionsRef.current = positions;

        const boundTextPositions = new Map<string, { x: number; y: number }>();
        for (const el of state.elements) {
          if (
            el.isDeleted ||
            !isTextElement(el) ||
            !el.containerId ||
            !currentSelection.has(el.containerId) ||
            currentSelection.has(el.id)
          ) {
            continue;
          }
          boundTextPositions.set(el.id, { x: el.x, y: el.y });
        }
        initialBoundTextPositionsRef.current = boundTextPositions;
      } else {
        // Clicked on empty space → start marquee
        if (!e.shiftKey) {
          setSelectedElementIds(new Set());
        }
        isMarqueeRef.current = true;
        dragStartRef.current = { x, y };
        selectionBoxRef.current = { x, y, width: 0, height: 0 };
      }
      return;
    }

    // ── Arrow connector mode ─────────────────────────────────────────
    if (state.activeTool === 'arrow' && connectorSourceRef.current) {
      const hit = getElementAtPosition(state.elements, x, y);
      if (hit && isShapeElement(hit) && hit.id !== connectorSourceRef.current) {
        // Second click → create bound arrow with boundary snap
        const sourceEl = state.elements.find((el) => el.id === connectorSourceRef.current);
        if (sourceEl) {
          const targetCx = hit.x + hit.width / 2;
          const targetCy = hit.y + hit.height / 2;
          const sourceCx = sourceEl.x + sourceEl.width / 2;
          const sourceCy = sourceEl.y + sourceEl.height / 2;
          const endpointOffset = Math.max(2, currentStyle.strokeWidth);

          // Compute boundary points facing each other
          const start = getShapeBoundaryPoint(sourceEl, targetCx, targetCy);
          const end = offsetPointFromCenter(
            getShapeBoundaryPoint(hit, sourceCx, sourceCy),
            targetCx,
            targetCy,
            endpointOffset,
          );
          const geometry = getNormalizedLinearGeometry(start.x, start.y, end.x, end.y);

          const arrow = createElement('arrow', start.x, start.y, currentStyle, {
            x: geometry.x,
            y: geometry.y,
            points: geometry.points,
            width: geometry.width,
            height: geometry.height,
            startBinding: { elementId: sourceEl.id, focus: 0, gap: 0 },
            endBinding: { elementId: hit.id, focus: 0, gap: 0 },
          });
          addElement(arrow);
        }
        connectorSourceRef.current = null;
        setConnectorPreview(null);
        return;
      }
      // Clicked empty space → cancel connector mode
      connectorSourceRef.current = null;
      setConnectorPreview(null);
      // Fall through to normal arrow drawing
    }

    // ── Arrow/Line on shape → connector mode ─────────────────────────
    if (state.activeTool === 'arrow') {
      const hit = getElementAtPosition(state.elements, x, y);
      if (hit && isShapeElement(hit)) {
        connectorSourceRef.current = hit.id;
        const bp = getShapeBoundaryPoint(hit, x, y);
        setConnectorPreview({ fromX: bp.x, fromY: bp.y, toX: x, toY: y });
        return;
      }
    }

    // ── Text tool ────────────────────────────────────────────────────
    if (state.activeTool === 'text') {
      // If already editing a text element, don't create a new one
      if (editingElementId) return;

      const clickedElement = getElementAtPosition(state.elements, x, y);

      if (clickedElement && isTextElement(clickedElement)) {
        setEditingElementId(clickedElement.id);
        return;
      }

      if (clickedElement && isShapeElement(clickedElement)) {
        // Check if there's already a text child
        const existingText = state.elements.find(
          (el) => el.type === 'text' && !el.isDeleted && 'containerId' in el && el.containerId === clickedElement.id
        );
        if (existingText) {
          setEditingElementId(existingText.id);
        } else {
          const horizontalPadding = TEXT_CONTAINER_PADDING / 2;
          const verticalPadding = 4;
          const textX = Math.max(
            clickedElement.x + horizontalPadding,
            Math.min(x, clickedElement.x + Math.max(clickedElement.width - horizontalPadding, horizontalPadding)),
          );
          const textY = Math.max(
            clickedElement.y + verticalPadding,
            Math.min(y, clickedElement.y + Math.max(clickedElement.height - verticalPadding, verticalPadding)),
          );
          const textEl = createElement('text', textX, textY, currentStyle, {
            textType: 'bound',
            text: '',
            containerId: clickedElement.id,
            textAlign: 'center' as const,
          });
          addElement(textEl);
          setEditingElementId(textEl.id);
        }
        return;
      }

      if (clickedElement && (clickedElement.type === 'arrow' || clickedElement.type === 'line')) {
        const existingText = state.elements.find(
          (el) => el.type === 'text' && !el.isDeleted && 'containerId' in el && el.containerId === clickedElement.id
        );
        if (existingText) {
          setEditingElementId(existingText.id);
        } else {
          const textEl = createElement('text', x - 20, y - 10, currentStyle, {
            textType: 'bound',
            text: '',
            containerId: clickedElement.id,
            textAlign: 'center' as const,
          });
          addElement(textEl);
          setEditingElementId(textEl.id);
        }
        return;
      }

      // Standalone text
      const textEl = createElement('text', x, y, currentStyle, {
        textType: 'standalone',
        text: '',
      });
      addElement(textEl);
      setEditingElementId(textEl.id);
      return;
    }

    // ── Drawing tools (rectangle, ellipse, diamond, cloud, etc.) ─────
    (e.target as Element).setPointerCapture(e.pointerId);
    startPointRef.current = { x, y };
    isDraggingRef.current = true;

    const overrides: Record<string, unknown> = {};
    if ((state.activeTool === 'line') && !connectorSourceRef.current) {
      const hitForBinding = getElementAtPosition(state.elements, x, y);
      if (hitForBinding && isShapeElement(hitForBinding)) {
        overrides.startBinding = { elementId: hitForBinding.id, focus: 0, gap: 0 };
      }
    }

    const element = createElement(state.activeTool as ExcalidrawElement['type'], x, y, currentStyle, overrides as Partial<ExcalidrawElement>);
    drawingElementIdRef.current = element.id;
    addElement(element);
  }, [containerRef, editingElementId, getScenePoint, addElement, deleteElements, setSelectedElementIds, currentStyle]);

  // ══════════════════════════════════════════════════════════════════════
  //  POINTER MOVE
  // ══════════════════════════════════════════════════════════════════════
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const state = useCanvasStore.getState();

    // ── Pan ───────────────────────────────────────────────────────────
    if (isPanningRef.current && lastPointerRef.current) {
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      state.setScroll(state.scrollX + dx / state.zoom, state.scrollY + dy / state.zoom);
      return;
    }

    // ── Eraser ────────────────────────────────────────────────────────
    if (isErasingRef.current) {
      const { x, y } = getScenePoint(e);
      let hit = getElementAtPosition(state.elements, x, y);
      if (hit && isTextElement(hit) && hit.textType === 'bound' && hit.containerId) {
        const containerId = hit.containerId;
        const container = state.elements.find((el) => el.id === containerId && !el.isDeleted);
        if (container) {
          hit = container;
        }
      }
      if (hit && !erasedIdsRef.current.has(hit.id)) {
        state.deleteElements([hit.id]);
        erasedIdsRef.current.add(hit.id);
        // We defer history save to PointerUp to batch erasures if needed, 
        // but for immediate deletion like this (single click/drag hit), maybe better to save at end of stroke.
        // Actually, eraser deletes continuously. We should save once at pointerUp.
      }
      return;
    }

    // ── Connector preview ────────────────────────────────────────────
    if (connectorSourceRef.current && state.activeTool === 'arrow') {
      const { x, y } = getScenePoint(e);
      const sourceEl = state.elements.find((el) => el.id === connectorSourceRef.current);
      if (sourceEl) {
        // Compute boundary point facing the mouse; if hovering a target, face its center
        const hovered = getElementAtPosition(state.elements, x, y);
        const targetX = (hovered && isShapeElement(hovered) && hovered.id !== sourceEl.id)
          ? hovered.x + hovered.width / 2 : x;
        const targetY = (hovered && isShapeElement(hovered) && hovered.id !== sourceEl.id)
          ? hovered.y + hovered.height / 2 : y;

        const fromPt = getShapeBoundaryPoint(sourceEl, targetX, targetY);
        // If hovering a target shape, snap the endpoint to its boundary too
        let toX = x;
        let toY = y;
        if (hovered && isShapeElement(hovered) && hovered.id !== sourceEl.id) {
          const hoveredCx = hovered.x + hovered.width / 2;
          const hoveredCy = hovered.y + hovered.height / 2;
          const endpointOffset = Math.max(2, state.currentStyle.strokeWidth);
          const toPt = offsetPointFromCenter(
            getShapeBoundaryPoint(hovered, sourceEl.x + sourceEl.width / 2, sourceEl.y + sourceEl.height / 2),
            hoveredCx,
            hoveredCy,
            endpointOffset,
          );
          toX = toPt.x;
          toY = toPt.y;
        }

        setConnectorPreview({ fromX: fromPt.x, fromY: fromPt.y, toX, toY });
      }
      return;
    }

    // ── Select: drag move ────────────────────────────────────────────
    if (isDraggingSelectionRef.current && dragStartRef.current) {
      const { x, y } = getScenePoint(e);
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;

      const updates = new Map<string, Partial<ExcalidrawElement>>();
      for (const [id, initial] of initialPositionsRef.current) {
        updates.set(id, { x: initial.x + dx, y: initial.y + dy });
      }

      for (const [id, initial] of initialBoundTextPositionsRef.current) {
        updates.set(id, { x: initial.x + dx, y: initial.y + dy });
      }

      // Recompute bound arrows using boundary points
      const movedIds = new Set(initialPositionsRef.current.keys());

      for (const el of state.elements) {
        if (el.isDeleted || movedIds.has(el.id)) continue;
        if (el.type !== 'arrow' && el.type !== 'line') continue;

        const linear = el as ExcalidrawLinearElementBase;
        const startBound = linear.startBinding && movedIds.has(linear.startBinding.elementId);
        const endBound = linear.endBinding && movedIds.has(linear.endBinding.elementId);
        if (!startBound && !endBound) continue;

        // Build "virtual" positions for bound shapes (current pos + drag delta)
        const getMovedPos = (elId: string): ExcalidrawElement | null => {
          const initial = initialPositionsRef.current.get(elId);
          const orig = state.elements.find((s) => s.id === elId);
          if (initial && orig) {
            return { ...orig, x: initial.x + dx, y: initial.y + dy } as ExcalidrawElement;
          }
          return orig ?? null;
        };

        const sourceEl = linear.startBinding
          ? getMovedPos(linear.startBinding.elementId) ?? state.elements.find((s) => s.id === linear.startBinding!.elementId) ?? null
          : null;
        const targetEl = linear.endBinding
          ? getMovedPos(linear.endBinding.elementId) ?? state.elements.find((s) => s.id === linear.endBinding!.elementId) ?? null
          : null;

        const { startPt, endPt } = computeLinearBoundPoints(
          linear,
          sourceEl,
          targetEl,
        );

        const geometry = getNormalizedLinearGeometry(startPt.x, startPt.y, endPt.x, endPt.y);
        updates.set(el.id, {
          x: geometry.x,
          y: geometry.y,
          points: geometry.points,
          width: geometry.width,
          height: geometry.height,
        } as Partial<ExcalidrawElement>);
      }

      state.updateElements(updates);
      setCursor('move');
      return;
    }

    // ── Select: drag resize ──────────────────────────────────────────
    if (
      isResizingSelectionRef.current &&
      resizeHandleRef.current &&
      resizeTargetIdRef.current &&
      resizeInitialBoundsRef.current
    ) {
      const { x, y } = getScenePoint(e);
      const initial = resizeInitialBoundsRef.current;
      const targetId = resizeTargetIdRef.current;
      const target = state.elements.find((el) => el.id === targetId && !el.isDeleted);
      if (!target) return;

      const boundText = state.elements.find(
        (el): el is ExcalidrawTextElement => !el.isDeleted && isTextElement(el) && el.containerId === target.id,
      );
      const textMinSize = boundText
        ? getMinTextBoxSize(boundText.fontSize, boundText.fontFamily)
        : getMinTextBoxSize();
      const minResizeWidth = Math.max(MIN_RESIZE_SIZE, textMinSize.minWidth);
      const minResizeHeight = Math.max(MIN_RESIZE_SIZE, textMinSize.minHeight);

      let left = initial.x;
      let top = initial.y;
      let right = initial.x + initial.width;
      let bottom = initial.y + initial.height;
      const handle = resizeHandleRef.current;

      if (handle === 'n' || handle === 'ne' || handle === 'nw') {
        top = Math.min(y, bottom - minResizeHeight);
      }
      if (handle === 's' || handle === 'se' || handle === 'sw') {
        bottom = Math.max(y, top + minResizeHeight);
      }
      if (handle === 'w' || handle === 'nw' || handle === 'sw') {
        left = Math.min(x, right - minResizeWidth);
      }
      if (handle === 'e' || handle === 'ne' || handle === 'se') {
        right = Math.max(x, left + minResizeWidth);
      }

      const newWidth = right - left;
      const newHeight = bottom - top;
      const updates = new Map<string, Partial<ExcalidrawElement>>();
      updates.set(target.id, { x: left, y: top, width: newWidth, height: newHeight });

      // Keep bound text centered inside resized containers.
      for (const el of state.elements) {
        if (el.isDeleted || !isTextElement(el) || el.containerId !== target.id) continue;
        const wrappedText = wrapText(
          el.text,
          Math.max(1, newWidth - TEXT_CONTAINER_PADDING),
          el.fontSize,
          el.fontFamily,
        );
        const measured = measureText(wrappedText, el.fontSize, el.fontFamily);
        const textWidth = Math.min(measured.width, newWidth);
        const textHeight = Math.min(measured.height, newHeight);
        updates.set(el.id, {
          text: wrappedText,
          width: textWidth,
          height: textHeight,
          baseline: measured.baseline,
          x: left + newWidth / 2 - textWidth / 2,
          y: top + newHeight / 2 - textHeight / 2,
        });
      }

      // Recompute connector endpoints bound to resized shape.
      for (const el of state.elements) {
        if (el.isDeleted || (el.type !== 'arrow' && el.type !== 'line')) continue;
        const linear = el as ExcalidrawLinearElementBase;
        const startBound = linear.startBinding?.elementId === target.id;
        const endBound = linear.endBinding?.elementId === target.id;
        if (!startBound && !endBound) continue;

        const sourceEl = linear.startBinding
          ? linear.startBinding.elementId === target.id
            ? ({ ...target, x: left, y: top, width: newWidth, height: newHeight } as ExcalidrawElement)
            : state.elements.find((s) => s.id === linear.startBinding!.elementId) ?? null
          : null;
        const targetEl = linear.endBinding
          ? linear.endBinding.elementId === target.id
            ? ({ ...target, x: left, y: top, width: newWidth, height: newHeight } as ExcalidrawElement)
            : state.elements.find((s) => s.id === linear.endBinding!.elementId) ?? null
          : null;

        const { startPt, endPt } = computeLinearBoundPoints(
          linear,
          sourceEl,
          targetEl,
        );

        const geometry = getNormalizedLinearGeometry(startPt.x, startPt.y, endPt.x, endPt.y);
        updates.set(el.id, {
          x: geometry.x,
          y: geometry.y,
          points: geometry.points,
          width: geometry.width,
          height: geometry.height,
        } as Partial<ExcalidrawElement>);
      }

      state.updateElements(updates);
      setCursor(getCursorForResizeHandle(handle));
      return;
    }

    // ── Select: marquee ──────────────────────────────────────────────
    if (isMarqueeRef.current && dragStartRef.current) {
      const { x, y } = getScenePoint(e);
      selectionBoxRef.current = {
        x: Math.min(x, dragStartRef.current.x),
        y: Math.min(y, dragStartRef.current.y),
        width: Math.abs(x - dragStartRef.current.x),
        height: Math.abs(y - dragStartRef.current.y),
      };
      return;
    }

    // ── Select: hover cursor ─────────────────────────────────────────
    if (state.activeTool === 'select' && !isDraggingRef.current) {
      const { x, y } = getScenePoint(e);
      if (state.selectedElementIds.size === 1) {
        const selectedId = [...state.selectedElementIds][0];
        const selectedEl = state.elements.find((el) => el.id === selectedId && !el.isDeleted);
        if (selectedEl && isResizableElement(selectedEl)) {
          const resizeHandle = getResizeHandleAtPoint(selectedEl, x, y);
          if (resizeHandle) {
            setCursor(getCursorForResizeHandle(resizeHandle));
            return;
          }
        }
      }
      const hit = getElementAtPosition(state.elements, x, y);
      setCursor(hit ? 'move' : 'default');
    }

    // ── Drawing tools ────────────────────────────────────────────────
    if (!isDraggingRef.current || !drawingElementIdRef.current) return;

    const { x, y } = getScenePoint(e);
    const startX = startPointRef.current?.x ?? 0;
    const startY = startPointRef.current?.y ?? 0;

    if (state.activeTool === 'freedraw') {
      const element = state.elements.find((el) => el.id === drawingElementIdRef.current);
      if (element && element.type === 'freedraw') {
        const points = [...element.points, { x: x - element.x, y: y - element.y }];
        updateElement(element.id, { points });
      }
    } else if (state.activeTool === 'line' || state.activeTool === 'arrow') {
      const element = state.elements.find((el) => el.id === drawingElementIdRef.current);
      if (element && (element.type === 'line' || element.type === 'arrow')) {
        const endX = x;
        const endY = y;
        let endBinding = null;

        const hoveredElement = getElementAtPosition(state.elements, x, y);
        if (hoveredElement && hoveredElement.id !== element.id && isShapeElement(hoveredElement)) {
          endBinding = { elementId: hoveredElement.id, focus: 0, gap: 0 };
        }

        const geometry = getNormalizedLinearGeometry(startX, startY, endX, endY);
        updateElement(element.id, {
          x: geometry.x,
          y: geometry.y,
          points: geometry.points,
          width: geometry.width,
          height: geometry.height,
          endBinding: endBinding ?? undefined,
        } as Partial<ExcalidrawElement>);
      }
    } else {
      // Box-select logic (rectangle, ellipse, diamond, cloud, hexagon, parallelogram)
      const minShapeSize = getMinTextBoxSize();
      const width = Math.max(Math.abs(x - startX), minShapeSize.minWidth);
      const height = Math.max(Math.abs(y - startY), minShapeSize.minHeight);
      const newX = x < startX ? startX - width : startX;
      const newY = y < startY ? startY - height : startY;
      updateElement(drawingElementIdRef.current, { x: newX, y: newY, width, height });
    }
  }, [getScenePoint, updateElement]);

  // ══════════════════════════════════════════════════════════════════════
  //  POINTER UP
  // ══════════════════════════════════════════════════════════════════════
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // ── Pan end ──────────────────────────────────────────────────────
    if (isPanningRef.current) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      isPanningRef.current = false;
      lastPointerRef.current = null;
      const state = useCanvasStore.getState();
      setCursor(getCursorForTool(state.activeTool));
      return;
    }

    // ── Eraser end ───────────────────────────────────────────────────
    if (isErasingRef.current) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      isErasingRef.current = false;
      if (erasedIdsRef.current.size > 0) {
        saveHistory();
        erasedIdsRef.current.clear();
      }
      return;
    }

    // ── Select: end drag ─────────────────────────────────────────────
    if (isDraggingSelectionRef.current) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      isDraggingSelectionRef.current = false;

      // Save history if we dragged somewhere (avoid saving on simple clicks)
      if (dragStartRef.current) {
        const { x, y } = getScenePoint(e);
        const dist = Math.hypot(x - dragStartRef.current.x, y - dragStartRef.current.y);
        if (dist > 2) { // Threshold to avoid saving history on simple clicks/selects
          saveHistory();
        }
      }

      dragStartRef.current = null;
      initialPositionsRef.current.clear();
      initialBoundTextPositionsRef.current.clear();
      setCursor('default');
      return;
    }

    // ── Select: end resize ───────────────────────────────────────────
    if (isResizingSelectionRef.current) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      isResizingSelectionRef.current = false;
      const start = resizeStartRef.current;
      if (start) {
        const { x, y } = getScenePoint(e);
        const dist = Math.hypot(x - start.x, y - start.y);
        if (dist > 2) {
          saveHistory();
        }
      }
      resizeHandleRef.current = null;
      resizeTargetIdRef.current = null;
      resizeStartRef.current = null;
      resizeInitialBoundsRef.current = null;
      setCursor('default');
      return;
    }

    // ── Select: end marquee ──────────────────────────────────────────
    if (isMarqueeRef.current) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      isMarqueeRef.current = false;
      if (selectionBoxRef.current) {
        const box = selectionBoxRef.current;
        const state = useCanvasStore.getState();
        const matched = getElementsInRect(state.elements, box.x, box.y, box.width, box.height);
        if (matched.length > 0) {
          setSelectedElementIds(new Set(matched.map((el) => el.id)));
        }
      }
      selectionBoxRef.current = null;
      dragStartRef.current = null;
      return;
    }

    // ── Drawing end ──────────────────────────────────────────────────
    if (isDraggingRef.current) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      // If we created something valid, save history
      if (drawingElementIdRef.current) {
        saveHistory();
      }
    }
    isDraggingRef.current = false;
    drawingElementIdRef.current = null;
    startPointRef.current = null;
  }, [getScenePoint, setSelectedElementIds, saveHistory]);

  // ══════════════════════════════════════════════════════════════════════
  //  DOUBLE CLICK (Text Editing)
  // ══════════════════════════════════════════════════════════════════════
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const state = useCanvasStore.getState();
    const { x, y } = getScenePoint(e as unknown as React.PointerEvent);

    const hit = getElementAtPosition(state.elements, x, y);

    // If double-clicked empty space -> create standalone text (any tool)
    if (!hit) {
      // Don't create if already editing
      if (editingElementId) return;

      const textEl = createElement('text', x, y, currentStyle, {
        textType: 'standalone',
        text: '',
      });
      addElement(textEl);
      setEditingElementId(textEl.id);
      return;
    }

    if (hit.type === 'text') {
      setEditingElementId(hit.id);
      return;
    }

    if (isShapeElement(hit)) {
      // Find existing child text or create one
      const existingText = state.elements.find(
        (el) => el.type === 'text' && !el.isDeleted && 'containerId' in el && el.containerId === hit.id
      );
      if (existingText) {
        setEditingElementId(existingText.id);
      } else {
        const horizontalPadding = TEXT_CONTAINER_PADDING / 2;
        const verticalPadding = 4;
        const textX = Math.max(
          hit.x + horizontalPadding,
          Math.min(x, hit.x + Math.max(hit.width - horizontalPadding, horizontalPadding)),
        );
        const textY = Math.max(
          hit.y + verticalPadding,
          Math.min(y, hit.y + Math.max(hit.height - verticalPadding, verticalPadding)),
        );
        const textEl = createElement('text', textX, textY, currentStyle, {
          textType: 'bound',
          text: '',
          containerId: hit.id,
          textAlign: 'center' as const,
        });
        addElement(textEl);
        setEditingElementId(textEl.id);
      }
      return;
    }

    if (hit.type === 'arrow' || hit.type === 'line') {
      const existingText = state.elements.find(
        (el) => el.type === 'text' && !el.isDeleted && 'containerId' in el && el.containerId === hit.id
      );
      if (existingText) {
        setEditingElementId(existingText.id);
      } else {
        // Place label at midpoint of the line/arrow
        const linear = hit as ExcalidrawLinearElementBase;
        let midX = x;
        let midY = y;
        if (linear.points.length >= 2) {
          const { startX, startY, endX, endY } = getLinearEndpoints(linear);
          midX = (startX + endX) / 2;
          midY = (startY + endY) / 2;
        }
        const textEl = createElement('text', midX - 20, midY - 10, currentStyle, {
          textType: 'bound',
          text: '',
          containerId: hit.id,
          textAlign: 'center' as const,
        });
        addElement(textEl);
        setEditingElementId(textEl.id);
      }
    }
  }, [getScenePoint, addElement, editingElementId, currentStyle, setEditingElementId]);

  // ══════════════════════════════════════════════════════════════════════
  //  WHEEL (Zoom + Pan)
  // ══════════════════════════════════════════════════════════════════════
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const state = useCanvasStore.getState();

    if (e.ctrlKey || e.metaKey) {
      // Pinch-zoom
      const newZoom = Math.max(0.1, Math.min(5, state.zoom - e.deltaY * 0.005));
      state.setZoom(newZoom);
    } else {
      // Pan
      state.setScroll(
        state.scrollX - e.deltaX / state.zoom,
        state.scrollY - e.deltaY / state.zoom,
      );
    }
  }, []);

  // Attach wheel listener with { passive: false } for preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, handleWheel]);

  //  INIT Rough.js
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (staticCanvasRef.current && !roughCanvasRef.current) {
      roughCanvasRef.current = rough.canvas(staticCanvasRef.current);
    }
  }, [staticCanvasRef]);

  // ══════════════════════════════════════════════════════════════════════
  //  RENDER LOOP
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let animFrameId: number;

    const loop = () => {
      const staticCanvas = staticCanvasRef.current;
      const interactiveCanvas = interactiveCanvasRef.current;
      const rc = roughCanvasRef.current;

      if (staticCanvas && rc) {
        if (sceneNonce !== lastNonceRef.current) {
          renderStaticScene(
            staticCanvas, rc, elements, scrollX, scrollY, zoom, '#121212', null,
          );
          lastNonceRef.current = sceneNonce;
        }
      }

      if (interactiveCanvas) {
        renderInteractiveScene(
          interactiveCanvas, elements, selectedElementIds, scrollX, scrollY, zoom,
          selectionBoxRef.current,
          connectorPreview,
        );
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [
    staticCanvasRef, interactiveCanvasRef, elements, selectedElementIds,
    scrollX, scrollY, zoom, sceneNonce, connectorPreview,
  ]);

  // Force static re-render on viewport change
  useEffect(() => {
    lastNonceRef.current = -1;
  }, [scrollX, scrollY, zoom]);

  // ══════════════════════════════════════════════════════════════════════
  //  TEXT EDITOR CALLBACKS
  // ══════════════════════════════════════════════════════════════════════
  const handleTextSubmit = useCallback((text: string) => {
    if (!editingElementId) return;
    const state = useCanvasStore.getState();
    const element = findTextById(state.elements, editingElementId);

    if (!element) {
      setEditingElementId(null);
      return;
    }

    if (text.trim() === '') {
      deleteElements([editingElementId]);
      setEditingElementId(null);
      return;
    }

    const updates = buildSubmittedTextUpdate(element, state.elements, text);
    updateElement(editingElementId, updates);
    saveHistory(); // Save after text edit
    setEditingElementId(null);
  }, [editingElementId, updateElement, deleteElements, saveHistory]);

  const handleTextCancel = useCallback(() => {
    if (editingElementId) {
      // If it was a new empty text, delete it
      const state = useCanvasStore.getState();
      const element = findTextById(state.elements, editingElementId);
      if (element && element.text === '') {
        deleteElements([editingElementId]);
      }
    }
    setEditingElementId(null);
  }, [editingElementId, deleteElements]);

  // ══════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════

  const editingElement = editingElementId
    ? elements.find((el): el is ExcalidrawTextElement => el.id === editingElementId && isTextElement(el))
    : undefined;
  const editingContainer = editingElement?.containerId
    ? elements.find((el) => el.id === editingElement.containerId && !el.isDeleted)
    : undefined;

  const showLinkDialog = useUIStore((s) => s.showLinkDialog);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none',
        cursor: activeTool === 'select' ? cursor : getCursorForTool(activeTool),
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <canvas
        ref={staticCanvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />
      <canvas
        ref={interactiveCanvasRef}
        style={{ position: 'absolute', inset: 0 }}
      />
      {editingElement && (
        <TextEditorOverlay
          element={editingElement}
          containerWidth={editingContainer?.width}
          scrollX={scrollX}
          scrollY={scrollY}
          zoom={zoom}
          onSubmit={handleTextSubmit}
          onCancel={handleTextCancel}
        />
      )}
      {showLinkDialog && <LinkDialog />}
    </div>
  );
}
