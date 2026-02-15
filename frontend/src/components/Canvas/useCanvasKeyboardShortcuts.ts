import { useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore.ts';
import { useUIStore } from '@/store/uiStore.ts';
import type { ExcalidrawElement } from '@/types/element.ts';

interface UseCanvasKeyboardShortcutsParams {
  redo: () => { elements: ExcalidrawElement[] } | null;
  undo: () => { elements: ExcalidrawElement[] } | null;
  replaceElements: (elements: ExcalidrawElement[]) => void;
  saveHistory: () => void;
  clearConnectorPreview: () => void;
}

export function useCanvasKeyboardShortcuts({
  redo,
  undo,
  replaceElements,
  saveHistory,
  clearConnectorPreview,
}: UseCanvasKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const state = useCanvasStore.getState();

      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementIds.size > 0) {
        state.deleteElements([...state.selectedElementIds]);
        saveHistory();
        return;
      }

      if (e.key === 'Escape') {
        clearConnectorPreview();
        state.setSelectedElementIds(new Set());
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allIds = new Set(state.elements.filter((el) => !el.isDeleted).map((el) => el.id));
        state.setSelectedElementIds(allIds);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (state.selectedElementIds.size === 1) {
          const selectedId = [...state.selectedElementIds][0];
          useUIStore.getState().setShowLinkDialog(true, selectedId);
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          const entry = redo();
          if (entry) replaceElements(entry.elements);
        } else {
          const entry = undo();
          if (entry) replaceElements(entry.elements);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearConnectorPreview, redo, replaceElements, saveHistory, undo]);
}
