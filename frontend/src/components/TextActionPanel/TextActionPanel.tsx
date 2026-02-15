import {
    AlignLeft, AlignCenter, AlignRight,
    Minus, Plus,
    Pen, Type, Code2,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore.ts';
import { saveHistory } from '@/utils/history.ts';
import type { ExcalidrawElement, ExcalidrawTextElement, FontFamily, TextAlign } from '@/types/element.ts';
import './TextActionPanel.css';

const TEXT_COLORS = [
    '#e0e0e0', '#ff4d4d', '#ff9f43', '#feca57',
    '#48dbfb', '#1dd1a1', '#54a0ff', '#5f27cd',
    '#ffffff', '#2d3436',
];

const FONT_SIZES = [12, 14, 16, 20, 24, 28, 32, 40, 48, 64];

export function TextActionPanel() {
    const selectedElementIds = useCanvasStore((s) => s.selectedElementIds);
    const elements = useCanvasStore((s) => s.elements);
    const updateElements = useCanvasStore((s) => s.updateElements);

    // Only show when text elements are selected
    const selectedTextElements = elements.filter(
        (el) => selectedElementIds.has(el.id) && el.type === 'text' && !el.isDeleted
    ) as ExcalidrawTextElement[];

    if (selectedTextElements.length === 0) return null;

    const firstEl = selectedTextElements[0];

    const updateTextProp = <K extends keyof ExcalidrawTextElement>(key: K, value: ExcalidrawTextElement[K]) => {
        const updates = new Map<string, Partial<ExcalidrawElement>>();
        selectedTextElements.forEach((el) => {
            updates.set(el.id, { [key]: value });
        });
        updateElements(updates);
        saveHistory();
    };

    // Font size helpers
    const currentSize = firstEl.fontSize;

    const decreaseSize = () => {
        const idx = FONT_SIZES.findIndex((s) => s >= currentSize);
        const newIdx = Math.max(0, (idx <= 0 ? 0 : idx - 1));
        updateTextProp('fontSize', FONT_SIZES[newIdx]);
    };

    const increaseSize = () => {
        const idx = FONT_SIZES.findIndex((s) => s >= currentSize);
        const target = idx === -1 ? FONT_SIZES.length - 1 : Math.min(FONT_SIZES.length - 1, idx + 1);
        updateTextProp('fontSize', FONT_SIZES[target]);
    };

    return (
        <div className="text-action-panel">
            {/* Font Size */}
            <div className="tap-section">
                <label>Size</label>
                <div className="tap-size-control">
                    <button className="tap-btn" onClick={decreaseSize} title="Decrease font size">
                        <Minus size={14} />
                    </button>
                    <select
                        className="tap-size-select"
                        value={currentSize}
                        onChange={(e) => updateTextProp('fontSize', parseInt(e.target.value))}
                    >
                        {FONT_SIZES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <button className="tap-btn" onClick={increaseSize} title="Increase font size">
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* Font Family / Weight */}
            <div className="tap-section">
                <label>Font</label>
                <div className="tap-button-group">
                    <button
                        className={`tap-btn ${firstEl.fontFamily === 'hand-drawn' ? 'active' : ''}`}
                        onClick={() => updateTextProp('fontFamily', 'hand-drawn' as FontFamily)}
                        title="Hand-drawn"
                    >
                        <Pen size={16} />
                    </button>
                    <button
                        className={`tap-btn ${firstEl.fontFamily === 'normal' ? 'active' : ''}`}
                        onClick={() => updateTextProp('fontFamily', 'normal' as FontFamily)}
                        title="Normal"
                    >
                        <Type size={16} />
                    </button>
                    <button
                        className={`tap-btn ${firstEl.fontFamily === 'code' ? 'active' : ''}`}
                        onClick={() => updateTextProp('fontFamily', 'code' as FontFamily)}
                        title="Code"
                    >
                        <Code2 size={16} />
                    </button>
                </div>
            </div>

            {/* Text Align */}
            <div className="tap-section">
                <label>Align</label>
                <div className="tap-button-group">
                    <button
                        className={`tap-btn ${firstEl.textAlign === 'left' ? 'active' : ''}`}
                        onClick={() => updateTextProp('textAlign', 'left' as TextAlign)}
                        title="Align Left"
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button
                        className={`tap-btn ${firstEl.textAlign === 'center' ? 'active' : ''}`}
                        onClick={() => updateTextProp('textAlign', 'center' as TextAlign)}
                        title="Align Center"
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button
                        className={`tap-btn ${firstEl.textAlign === 'right' ? 'active' : ''}`}
                        onClick={() => updateTextProp('textAlign', 'right' as TextAlign)}
                        title="Align Right"
                    >
                        <AlignRight size={16} />
                    </button>
                </div>
            </div>

            {/* Text Color */}
            <div className="tap-section">
                <label>Color</label>
                <div className="tap-color-picker">
                    {TEXT_COLORS.map((color) => (
                        <button
                            key={color}
                            className={`tap-color-swatch ${firstEl.strokeColor === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateTextProp('strokeColor', color)}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

