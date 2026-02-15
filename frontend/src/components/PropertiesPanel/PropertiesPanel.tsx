import {
    Square, Circle, Spline,
    Trash2, BringToFront, SendToBack,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore.ts';
import type { ExcalidrawElement, ElementStyle, StrokeStyle, FillStyle } from '@/types/element.ts';

import { saveHistory } from '@/utils/history.ts';

import './PropertiesPanel.css';

const STROKE_COLORS = [
    '#e0e0e0', '#ff4d4d', '#ff9f43', '#feca57', '#48dbfb', '#1dd1a1', '#54a0ff', '#5f27cd', '#c8d6e5',
];

const BG_COLORS = [
    'transparent', '#ffcccc', '#ffeaa7', '#55efc4', '#81ecec', '#74b9ff', '#a29bfe', '#dfe6e9', '#2d3436',
];

export function PropertiesPanel() {
    const selectedElementIds = useCanvasStore((s) => s.selectedElementIds);
    const elements = useCanvasStore((s) => s.elements);
    const updateElements = useCanvasStore((s) => s.updateElements);
    const deleteElements = useCanvasStore((s) => s.deleteElements);
    const currentStyle = useCanvasStore((s) => s.currentStyle);
    const setCurrentStyle = useCanvasStore((s) => s.setCurrentStyle);
    const bringToFront = useCanvasStore((s) => s.bringToFront);
    const sendToBack = useCanvasStore((s) => s.sendToBack);

    // If nothing selected, we edit the global currentStyle
    // If selection exists, we edit those elements AND update currentStyle
    const isSelection = selectedElementIds.size > 0;

    // Helper to get current value (from selection or global state)
    const getValue = <K extends keyof ElementStyle>(key: K): ElementStyle[K] => {
        if (!isSelection) return currentStyle[key];
        const firstId = [...selectedElementIds][0];
        const el = elements.find(e => e.id === firstId);
        return el ? (el as ElementStyle)[key] : currentStyle[key];
    };

    const updateValue = <K extends keyof ElementStyle>(key: K, value: ElementStyle[K]) => {
        setCurrentStyle({ [key]: value });
        if (isSelection) {
            const updates = new Map<string, Partial<ExcalidrawElement>>();
            selectedElementIds.forEach(id => {
                updates.set(id, { [key]: value });
            });
            updateElements(updates);
            saveHistory(); // Save history after update
        }
    };

    const handleDelete = () => {
        deleteElements([...selectedElementIds]);
        saveHistory(); // Save history after deletion
    };

    return (
        <div className="properties-panel">
            <div className="panel-section">
                <label>Stroke</label>
                <div className="color-picker">
                    {STROKE_COLORS.map(color => (
                        <button
                            key={color}
                            className={`color-swatch ${getValue('strokeColor') === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateValue('strokeColor', color)}
                        />
                    ))}
                </div>
            </div>

            <div className="panel-section">
                <label>Background</label>
                <div className="color-picker">
                    {BG_COLORS.map(color => (
                        <button
                            key={color}
                            className={`color-swatch ${getValue('backgroundColor') === color ? 'active' : ''}`}
                            style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                            onClick={() => updateValue('backgroundColor', color)}
                        >
                            {color === 'transparent' && <div className="slash" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel-section">
                <label>Fill</label>
                <div className="button-group">
                    {(['hachure', 'cross-hatch', 'solid'] as FillStyle[]).map(fill => (
                        <button
                            key={fill}
                            className={getValue('fillStyle') === fill ? 'active' : ''}
                            onClick={() => updateValue('fillStyle', fill)}
                            title={fill}
                        >
                            {fill === 'hachure' && <Spline size={16} />}
                            {fill === 'cross-hatch' && <div style={{ transform: 'rotate(90deg)' }}><Spline size={16} /></div>}
                            {fill === 'solid' && <Square size={16} fill="currentColor" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel-section">
                <label>Stroke Width</label>
                <div className="button-group">
                    {[1, 2, 4].map(width => (
                        <button
                            key={width}
                            className={getValue('strokeWidth') === width ? 'active' : ''}
                            onClick={() => updateValue('strokeWidth', width)}
                        >
                            <div style={{ height: width, width: 20, backgroundColor: 'currentColor' }} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel-section">
                <label>Stroke Style</label>
                <div className="button-group">
                    {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map(style => (
                        <button
                            key={style}
                            className={getValue('strokeStyle') === style ? 'active' : ''}
                            onClick={() => updateValue('strokeStyle', style)}
                            title={style}
                        >
                            {style === 'solid' && <div style={{ width: 20, height: 2, background: 'currentColor' }} />}
                            {style === 'dashed' && <div style={{ width: 20, height: 2, background: 'linear-gradient(to right, currentColor 50%, transparent 50%)', backgroundSize: '8px 100%' }} />}
                            {style === 'dotted' && <div style={{ width: 20, height: 2, background: 'radial-gradient(circle, currentColor 2px, transparent 2.5px)', backgroundSize: '6px 100%' }} />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel-section">
                <label>Roundness</label>
                <div className="button-group">
                    <button
                        className={getValue('roundness') === 0 ? 'active' : ''}
                        onClick={() => updateValue('roundness', 0)}
                        title="Sharp"
                    >
                        <Square size={16} />
                    </button>
                    <button
                        className={getValue('roundness') > 0 ? 'active' : ''}
                        onClick={() => updateValue('roundness', 1)}
                        title="Round"
                    >
                        <Circle size={16} />
                    </button>
                </div>
            </div>

            <div className="panel-section">
                <label>Opacity</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={getValue('opacity')}
                    onChange={(e) => updateValue('opacity', parseInt(e.target.value))}
                />
            </div>

            {isSelection && (
                <div className="panel-actions">
                    <div className="panel-divider" />
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button onClick={() => bringToFront([...selectedElementIds])} title="Bring to Front">
                            <BringToFront size={18} />
                        </button>
                        <button onClick={() => sendToBack([...selectedElementIds])} title="Send to Back">
                            <SendToBack size={18} />
                        </button>
                        <button onClick={handleDelete} title="Delete" className="danger">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

