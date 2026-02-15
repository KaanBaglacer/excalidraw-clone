import { create } from 'zustand';

interface UIState {
  showPropertiesPanel: boolean;
  showExportDialog: boolean;
  showFileMenu: boolean;
  showLinkDialog: boolean;
  linkDialogElementId: string | null;

  setShowPropertiesPanel: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setShowFileMenu: (show: boolean) => void;
  setShowLinkDialog: (show: boolean, elementId?: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  showPropertiesPanel: true,
  showExportDialog: false,
  showFileMenu: false,
  showLinkDialog: false,
  linkDialogElementId: null,

  setShowPropertiesPanel: (show) => set({ showPropertiesPanel: show }),
  setShowExportDialog: (show) => set({ showExportDialog: show }),
  setShowFileMenu: (show) => set({ showFileMenu: show }),
  setShowLinkDialog: (show, elementId) =>
    set({ showLinkDialog: show, linkDialogElementId: elementId ?? null }),
}));
