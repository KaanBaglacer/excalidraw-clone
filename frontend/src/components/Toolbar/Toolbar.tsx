import {
    MousePointer2,
    Square,
    Circle,
    Diamond,
    Hexagon,
    MoveRight,
    Minus,
    Pencil,
    Type,
    Eraser,
    MoreHorizontal,
    Cloud,
    Lock,
    Hand,
} from 'lucide-react';
import { useEffect } from 'react';
import type { ToolType } from '@/types/tool.ts';
import { useCanvasStore } from '@/store/canvasStore.ts';
import './Toolbar.css';

type ToolItem =
    | { divider: true; id?: never }
    | { divider?: never; id: string; icon: React.ElementType | null; label: string; shortcut?: string };

const TOOLS: ToolItem[] = [
    { id: 'lock', icon: null, label: 'Lock tool' },
    { divider: true },
    { id: 'hand', icon: Hand, label: 'Hand', shortcut: '1' },
    { id: 'select', icon: MousePointer2, label: 'Selection', shortcut: '2' },
    { divider: true },
    { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: '3' },
    { id: 'diamond', icon: Diamond, label: 'Diamond', shortcut: '4' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: '5' },
    { id: 'hexagon', icon: Hexagon, label: 'Hexagon', shortcut: '6' },
    { id: 'parallelogram', icon: null, label: 'Parallelogram', shortcut: '7' },
    { id: 'cloud', icon: Cloud, label: 'Cloud', shortcut: '8' },
    { divider: true },
    { id: 'arrow', icon: MoveRight, label: 'Arrow', shortcut: '9' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'freedraw', icon: Pencil, label: 'Draw' },
    { id: 'text', icon: Type, label: 'Text' },
    { divider: true },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { divider: true },
    { id: 'library', icon: MoreHorizontal, label: 'Library' },
];

interface ToolButtonProps {
    id: ToolType;
    icon: React.ElementType | null;
    label: string;
    activeTool: ToolType;
    onClick: (id: ToolType) => void;
    shortcut?: string;
    disabled?: boolean;
}

function ToolButton({ id, icon: Icon, label, activeTool, onClick, shortcut, disabled }: ToolButtonProps) {
    const isActive = activeTool === id;

    return (
        <button
            className={`toolbar-button ${isActive ? 'active' : ''}`}
            onClick={() => !disabled && onClick(id)}
            disabled={disabled}
            aria-label={`${label} ${shortcut ? `(${shortcut})` : ''}`}
        >
            {Icon ? <Icon size={20} /> : <ParallelogramIcon />}
        </button>
    );
}

function ParallelogramIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="6,4 22,4 18,20 2,20" />
        </svg>
    );
}

export function Toolbar() {
    const activeTool = useCanvasStore((s) => s.activeTool);
    const setActiveTool = useCanvasStore((s) => s.setActiveTool);

    const isLocked = false;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const tool = TOOLS.find(t => !t.divider && t.shortcut && t.shortcut === e.key);
            if (tool && !tool.divider && tool.id) {
                setActiveTool(tool.id as ToolType);
            }

            if (e.key === 'v') setActiveTool('select');
            if (e.key === 'h') setActiveTool('hand');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTool]);

    return (
        <div className="toolbar">
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className={`toolbar-button ${isLocked ? 'active' : ''}`} aria-label="Lock tool">
                    <Lock size={16} />
                </button>
            </div>
            <div className="toolbar-divider" />

            {TOOLS.map((tool, index) => {
                if (tool.divider) {
                    return <div key={`divider-${index}`} className="toolbar-divider" />;
                }

                if (tool.id === 'lock') return null;

                return (
                    <ToolButton
                        key={tool.id}
                        id={tool.id as ToolType}
                        icon={tool.icon ?? null}
                        label={tool.label}
                        activeTool={activeTool}
                        onClick={setActiveTool}
                        shortcut={tool.shortcut}
                    />
                );
            })}
        </div>
    );
}
