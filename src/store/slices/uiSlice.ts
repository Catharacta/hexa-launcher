export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

/**
 * UIの表示状態（モーダル、トースト通知、ダイアログなど）を管理するスライス。
 */
export interface UiSlice {
    isSettingsOpen: boolean;
    treeModalOpen: boolean;
    cellEditDialogOpen: boolean;
    editingCellId: string | null;
    /** トースト通知のリスト */
    toasts: Toast[];
    setSettingsOpen: (isOpen: boolean) => void;
    setTreeModalOpen: (isOpen: boolean) => void;
    setCellEditDialogOpen: (isOpen: boolean, cellId?: string) => void;
    uwpSelectorOpen: boolean;
    targetCellIdForUwp: string | null;
    setUwpSelectorOpen: (isOpen: boolean, cellId?: string) => void;
    isExiting: boolean;
    setIsExiting: (isExiting: boolean) => void;
    /** トースト通知を追加します */
    addToast: (message: string, type?: Toast['type'], duration?: number) => void;
    removeToast: (id: string) => void;
}

export const createUiSlice = (set: any, _get: any): UiSlice => ({
    isSettingsOpen: false,
    treeModalOpen: false,
    cellEditDialogOpen: false,
    editingCellId: null,
    toasts: [],
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
    setTreeModalOpen: (isOpen) => set({ treeModalOpen: isOpen }),
    setCellEditDialogOpen: (isOpen, cellId) => set({
        cellEditDialogOpen: isOpen,
        editingCellId: isOpen ? cellId || null : null
    }),
    uwpSelectorOpen: false,
    targetCellIdForUwp: null,
    setUwpSelectorOpen: (isOpen, cellId) => set({
        uwpSelectorOpen: isOpen,
        targetCellIdForUwp: isOpen ? cellId || null : null
    }),
    isExiting: false,
    setIsExiting: (isExiting) => set({ isExiting }),
    addToast: (message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state: any) => ({
            toasts: [...state.toasts, { id, message, type, duration }]
        }));
        if (duration > 0) {
            setTimeout(() => {
                set((state: any) => ({
                    toasts: state.toasts.filter((t: Toast) => t.id !== id)
                }));
            }, duration);
        }
    },
    removeToast: (id) => set((state: any) => ({
        toasts: state.toasts.filter((t: Toast) => t.id !== id)
    })),
});
