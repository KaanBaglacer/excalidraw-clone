import { useState, useRef, useEffect } from 'react';
import type { ExcalidrawElement } from '@/types/element.ts';
import { useCanvasStore } from '@/store/canvasStore.ts';
import { useUIStore } from '@/store/uiStore.ts';
import './LinkDialog.css';

function getElementLabel(element: ExcalidrawElement, allElements: ExcalidrawElement[]): string {
  // Try to find a text child
  const textChild = allElements.find(
    (el) => el.type === 'text' && !el.isDeleted && 'containerId' in el && el.containerId === element.id,
  );
  if (textChild && textChild.type === 'text' && textChild.text) {
    return textChild.text.substring(0, 30);
  }
  if (element.type === 'text' && 'text' in element && element.text) {
    return element.text.substring(0, 30);
  }
  return `${element.type} (${element.id.substring(0, 6)})`;
}

export function LinkDialog() {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const elements = useCanvasStore((s) => s.elements);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const linkDialogElementId = useUIStore((s) => s.linkDialogElementId);
  const setShowLinkDialog = useUIStore((s) => s.setShowLinkDialog);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!linkDialogElementId) return null;

  const sourceElement = elements.find((el) => el.id === linkDialogElementId);
  if (!sourceElement) return null;

  const currentLink = sourceElement.link;
  const currentTargetId = currentLink?.startsWith('element://') ? currentLink.slice(10) : null;

  // List all non-deleted elements except the source and text children
  const candidates = elements.filter((el) => {
    if (el.isDeleted || el.id === linkDialogElementId) return false;
    if (el.type === 'text' && 'containerId' in el && el.containerId) return false;
    return true;
  });

  const filtered = search
    ? candidates.filter((el) => {
        const label = getElementLabel(el, elements).toLowerCase();
        return label.includes(search.toLowerCase()) || el.type.includes(search.toLowerCase());
      })
    : candidates;

  const handleSetLink = (targetId: string) => {
    updateElement(linkDialogElementId, { link: `element://${targetId}` } as Partial<ExcalidrawElement>);
    setShowLinkDialog(false);
  };

  const handleRemoveLink = () => {
    updateElement(linkDialogElementId, { link: undefined } as Partial<ExcalidrawElement>);
    setShowLinkDialog(false);
  };

  const handleClose = () => {
    setShowLinkDialog(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div className="link-dialog-backdrop" onClick={handleClose}>
      <div className="link-dialog" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="link-dialog-header">
          <span>Link to element</span>
          <button className="link-dialog-close" onClick={handleClose}>&times;</button>
        </div>

        <input
          ref={inputRef}
          className="link-dialog-search"
          type="text"
          placeholder="Search elements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {currentTargetId && (
          <button className="link-dialog-remove" onClick={handleRemoveLink}>
            Remove current link
          </button>
        )}

        <div className="link-dialog-list">
          {filtered.length === 0 && (
            <div className="link-dialog-empty">No elements found</div>
          )}
          {filtered.map((el) => (
            <button
              key={el.id}
              className={`link-dialog-item ${el.id === currentTargetId ? 'current' : ''}`}
              onClick={() => handleSetLink(el.id)}
            >
              <span className="link-dialog-item-type">{el.type}</span>
              <span className="link-dialog-item-label">{getElementLabel(el, elements)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
