import { create } from 'zustand';
import type { ExcalidrawElement } from '@/types/element.ts';
import type { AppState } from '@/types/canvas.ts';

const MAX_HISTORY_SIZE = 100;

interface HistoryEntry {
  elements: ExcalidrawElement[];
  appState: AppState;
}

interface HistoryState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  pushEntry: (entry: HistoryEntry) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushEntry: (entry) =>
    set((state) => ({
      undoStack: [
        ...state.undoStack.slice(-(MAX_HISTORY_SIZE - 1)),
        {
          elements: entry.elements.map((el) => ({ ...el })),
          appState: { ...entry.appState },
        },
      ],
      redoStack: [],
    })),

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length < 2) return null;

    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];

    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, current],
    });

    return previous;
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return null;

    const entry = redoStack[redoStack.length - 1];

    set({
      undoStack: [...undoStack, entry],
      redoStack: redoStack.slice(0, -1),
    });

    return entry;
  },

  clear: () => set({ undoStack: [], redoStack: [] }),
}));
