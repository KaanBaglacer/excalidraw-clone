import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ExcalidrawTextElement } from '@/types/element.ts';

const FONT_FAMILY_MAP: Record<string, string> = {
  'hand-drawn': '"Virgil", "Segoe UI", sans-serif',
  normal: '"Helvetica", "Arial", sans-serif',
  code: '"Cascadia Code", "Fira Code", monospace',
};

interface TextEditorOverlayProps {
  element: ExcalidrawTextElement;
  containerBounds?: { x: number; y: number; width: number; height: number };
  scrollX: number;
  scrollY: number;
  zoom: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function TextEditorOverlay({
  element, containerBounds, scrollX, scrollY, zoom, onSubmit, onCancel,
}: TextEditorOverlayProps) {
  const [text, setText] = useState(element.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      ta.select();
    }
  }, []);

  const screenX = (element.x + scrollX) * zoom;
  const screenY = (element.y + scrollY) * zoom;
  const fontSize = element.fontSize * zoom;
  const editorWidth = Math.max(140, fontSize * 8);
  const isBound = Boolean(element.containerId);
  const editingTextAlign: CanvasTextAlign = isBound ? 'left' : (element.textAlign as CanvasTextAlign);
  const centeredInContainer = isBound && Boolean(containerBounds);
  const overlayX = centeredInContainer && containerBounds
    ? (containerBounds.x + containerBounds.width / 2 + scrollX) * zoom
    : screenX;
  const overlayY = centeredInContainer && containerBounds
    ? (containerBounds.y + containerBounds.height / 2 + scrollY) * zoom
    : screenY;

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    resizeTextarea();
  }, [text, fontSize, editorWidth, element.lineHeight]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      onSubmit(text);
    }
  };

  const handleBlur = () => {
    if (text.trim() === '') {
      onCancel();
    } else {
      onSubmit(text);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
      }}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        position: 'absolute',
        left: overlayX,
        top: overlayY,
        transform: centeredInContainer ? 'translate(-50%, -50%)' : 'none',
        fontSize,
        fontFamily: FONT_FAMILY_MAP[element.fontFamily] || FONT_FAMILY_MAP.normal,
        textAlign: editingTextAlign,
        color: element.strokeColor,
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        padding: 0,
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: `${element.lineHeight}`,
        zIndex: 200,
        width: editorWidth,
        minWidth: editorWidth,
        boxSizing: 'border-box',
        minHeight: '20px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        caretColor: element.strokeColor,
      }}
      rows={1}
    />
  );
}
