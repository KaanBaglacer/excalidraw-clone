import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ExcalidrawElement, ElementStyle } from '@/types/element.ts';
import type { ToolType } from '@/types/tool.ts';
import { DEFAULT_ELEMENT_STYLE } from '@/types/element.ts';

interface CanvasState {
  elements: ExcalidrawElement[];
  selectedElementIds: Set<string>;
  activeTool: ToolType;
  scrollX: number;
  scrollY: number;
  zoom: number;
  currentStyle: ElementStyle;
  sceneNonce: number;

  addElement: (element: ExcalidrawElement) => void;
  updateElement: (id: string, updates: Partial<ExcalidrawElement>) => void;
  updateElements: (updates: Map<string, Partial<ExcalidrawElement>>) => void;
  deleteElements: (ids: string[]) => void;
  setSelectedElementIds: (ids: Set<string>) => void;
  setActiveTool: (tool: ToolType) => void;
  setViewport: (scrollX: number, scrollY: number, zoom: number) => void;
  setZoom: (zoom: number) => void;
  setScroll: (scrollX: number, scrollY: number) => void;
  setCurrentStyle: (style: Partial<ElementStyle>) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;
  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;
  replaceElements: (elements: ExcalidrawElement[]) => void;
  incrementNonce: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  immer((set) => ({
    elements: [],
    selectedElementIds: new Set<string>(),
    activeTool: 'select',
    scrollX: 0,
    scrollY: 0,
    zoom: 1,
    currentStyle: { ...DEFAULT_ELEMENT_STYLE },
    sceneNonce: 0,

    addElement: (element) =>
      set((state) => {
        state.elements.push(element);
        state.sceneNonce++;
      }),

    updateElement: (id, updates) =>
      set((state) => {
        const idx = state.elements.findIndex((el) => el.id === id);
        if (idx !== -1) {
          Object.assign(state.elements[idx], updates, {
            version: state.elements[idx].version + 1,
          });
          state.sceneNonce++;
        }
      }),

    updateElements: (updates) =>
      set((state) => {
        for (const [id, upd] of updates) {
          const idx = state.elements.findIndex((el) => el.id === id);
          if (idx !== -1) {
            Object.assign(state.elements[idx], upd, {
              version: state.elements[idx].version + 1,
            });
          }
        }
        state.sceneNonce++;
      }),

    deleteElements: (ids) =>
      set((state) => {
        const idSet = new Set(ids);
        for (const el of state.elements) {
          if (el.isDeleted || el.type !== 'text') continue;
          if (el.textType === 'bound' && el.containerId && idSet.has(el.containerId)) {
            idSet.add(el.id);
          }
        }
        for (const el of state.elements) {
          if (idSet.has(el.id)) {
            el.isDeleted = true;
            el.version++;
          }
        }
        state.selectedElementIds = new Set();
        state.sceneNonce++;
      }),

    setSelectedElementIds: (ids) =>
      set((state) => {
        state.selectedElementIds = ids;
      }),

    setActiveTool: (tool) =>
      set((state) => {
        state.activeTool = tool;
        if (tool !== 'select') {
          state.selectedElementIds = new Set();
        }
      }),

    setViewport: (scrollX, scrollY, zoom) =>
      set((state) => {
        state.scrollX = scrollX;
        state.scrollY = scrollY;
        state.zoom = zoom;
      }),

    setZoom: (zoom) =>
      set((state) => {
        state.zoom = zoom;
      }),

    setScroll: (scrollX, scrollY) =>
      set((state) => {
        state.scrollX = scrollX;
        state.scrollY = scrollY;
      }),

    setCurrentStyle: (style) =>
      set((state) => {
        Object.assign(state.currentStyle, style);
      }),

    bringToFront: (ids) =>
      set((state) => {
        const idSet = new Set(ids);
        const maxIndex = Math.max(...state.elements.map((el) => el.index));
        let offset = 1;
        for (const el of state.elements) {
          if (idSet.has(el.id)) {
            el.index = maxIndex + offset++;
            el.version++;
          }
        }
        state.sceneNonce++;
      }),

    sendToBack: (ids) =>
      set((state) => {
        const idSet = new Set(ids);
        const minIndex = Math.min(...state.elements.map((el) => el.index));
        let offset = 1;
        for (const el of state.elements) {
          if (idSet.has(el.id)) {
            el.index = minIndex - offset++;
            el.version++;
          }
        }
        state.sceneNonce++;
      }),

    bringForward: (ids) =>
      set((state) => {
        const idSet = new Set(ids);
        const sorted = [...state.elements].sort((a, b) => a.index - b.index);
        for (let i = sorted.length - 2; i >= 0; i--) {
          if (idSet.has(sorted[i].id) && !idSet.has(sorted[i + 1].id)) {
            const temp = sorted[i].index;
            sorted[i].index = sorted[i + 1].index;
            sorted[i + 1].index = temp;
            sorted[i].version++;
            sorted[i + 1].version++;
          }
        }
        state.sceneNonce++;
      }),

    sendBackward: (ids) =>
      set((state) => {
        const idSet = new Set(ids);
        const sorted = [...state.elements].sort((a, b) => a.index - b.index);
        for (let i = 1; i < sorted.length; i++) {
          if (idSet.has(sorted[i].id) && !idSet.has(sorted[i - 1].id)) {
            const temp = sorted[i].index;
            sorted[i].index = sorted[i - 1].index;
            sorted[i - 1].index = temp;
            sorted[i].version++;
            sorted[i - 1].version++;
          }
        }
        state.sceneNonce++;
      }),

    replaceElements: (elements) =>
      set((state) => {
        state.elements = elements;
        state.sceneNonce++;
      }),

    incrementNonce: () =>
      set((state) => {
        state.sceneNonce++;
      }),
  })),
);
