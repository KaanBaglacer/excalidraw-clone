import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ExcalidrawTextElement } from '@/types/element.ts';

const FONT_FAMILY_MAP: Record<string, string> = {
  'hand-drawn': '"Virgil", "Segoe UI", sans-serif',
  normal: '"Helvetica", "Arial", sans-serif',
  code: '"Cascadia Code", "Fira Code", monospace',
};

interface TextEditorOverlayProps {
  element: ExcalidrawTextElement;
  containerWidth?: number;
  scrollX: number;
  scrollY: number;
  zoom: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function TextEditorOverlay({
  element, containerWidth: _containerWidth, scrollX, scrollY, zoom, onSubmit, onCancel,
}: TextEditorOverlayProps) {
  const [text, setText] = useState(element.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  void _containerWidth;

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
  const defaultStandaloneWidth = Math.max(140, fontSize * 8);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      onSubmit(text);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        fontSize,
        fontFamily: FONT_FAMILY_MAP[element.fontFamily] || FONT_FAMILY_MAP.normal,
        textAlign: element.textAlign as CanvasTextAlign,
        color: element.strokeColor,
        background: 'rgba(30, 30, 46, 0.9)',
        border: '1px solid #6366f1',
        borderRadius: '4px',
        padding: '4px 8px',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: `${element.lineHeight}`,
        zIndex: 200,
        width: defaultStandaloneWidth,
        minWidth: defaultStandaloneWidth,
        boxSizing: 'border-box',
        minHeight: '30px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        caretColor: '#e0e0e0',
      }}
      rows={1}
    />
  );
}
