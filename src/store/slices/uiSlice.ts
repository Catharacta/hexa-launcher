export interface UiSlice {
    isSettingsOpen: boolean;
    treeModalOpen: boolean;
    setSettingsOpen: (isOpen: boolean) => void;
    setTreeModalOpen: (isOpen: boolean) => void;
}

export const createUiSlice = (set: any, _get: any): UiSlice => ({
    isSettingsOpen: false,
    treeModalOpen: false,
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
    setTreeModalOpen: (isOpen) => set({ treeModalOpen: isOpen }),
});
