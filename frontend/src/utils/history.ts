import { useCanvasStore } from '@/store/canvasStore.ts';
import { useHistoryStore } from '@/store/historyStore.ts';
import { DEFAULT_APP_STATE } from '@/types/canvas.ts';

export function saveHistory() {
    const state = useCanvasStore.getState();
    useHistoryStore.getState().pushEntry({
        elements: state.elements,
        appState: DEFAULT_APP_STATE
    });
}
