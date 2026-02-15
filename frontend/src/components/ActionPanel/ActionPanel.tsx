import { Undo2, Redo2, Minus, Plus } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore.ts';
import { useHistoryStore } from '@/store/historyStore.ts';
import './ActionPanel.css';

export function ActionPanel() {
    const zoom = useCanvasStore((s) => s.zoom);
    const setZoom = useCanvasStore((s) => s.setZoom);

    const undo = useHistoryStore((s) => s.undo);
    const redo = useHistoryStore((s) => s.redo);
    const undoStack = useHistoryStore((s) => s.undoStack);
    const redoStack = useHistoryStore((s) => s.redoStack);

    const replaceElements = useCanvasStore((s) => s.replaceElements);

    // Zoom helpers
    const handleZoomOut = () => {
        const newZoom = Math.max(0.1, zoom - 0.1);
        setZoom(parseFloat(newZoom.toFixed(1)));
    };

    const handleZoomIn = () => {
        const newZoom = Math.min(5, zoom + 0.1);
        setZoom(parseFloat(newZoom.toFixed(1)));
    };

    const handleResetZoom = () => {
        setZoom(1);
    };

    const handleUndo = () => {
        const entry = undo();
        if (entry) {
            replaceElements(entry.elements);
        }
    };

    const handleRedo = () => {
        const entry = redo();
        if (entry) {
            replaceElements(entry.elements);
        }
    };

    return (
        <div className="action-panel">
            <div className="action-group">
                <button
                    className="action-button"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                >
                    <Minus size={16} />
                </button>
                <button
                    className="action-button text"
                    onClick={handleResetZoom}
                    title="Reset Zoom"
                >
                    {Math.round(zoom * 100)}%
                </button>
                <button
                    className="action-button"
                    onClick={handleZoomIn}
                    title="Zoom In"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="action-divider" />

            <div className="action-group">
                <button
                    className="action-button"
                    onClick={handleUndo}
                    disabled={undoStack.length <= 1} // Need at least current state + 1 previous
                    title="Undo"
                >
                    <Undo2 size={16} />
                </button>
                <button
                    className="action-button"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    title="Redo"
                >
                    <Redo2 size={16} />
                </button>
            </div>
        </div>
    );
}
