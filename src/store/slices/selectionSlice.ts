/**
 * セル選択状態を管理するスライス。
 *
 * 単一選択、複数選択（Ctrl/Shift）、選択解除などの操作を提供します。
 */
export interface SelectionSlice {
    selectedCellIds: string[];
    selectCell: (id: string, multi: boolean) => void;
    deselectCell: (id: string) => void;
    clearSelection: () => void;
}

export const createSelectionSlice = (set: any, _get: any): SelectionSlice => ({
    selectedCellIds: ['root-center'],
    selectCell: (id, multi) => {
        set((state: any) => {
            if (multi) {
                const isSelected = state.selectedCellIds.includes(id);
                return {
                    selectedCellIds: isSelected
                        ? state.selectedCellIds.filter((cid: string) => cid !== id)
                        : [...state.selectedCellIds, id],
                };
            } else {
                return { selectedCellIds: [id] };
            }
        });
    },
    deselectCell: (id) => {
        set((state: any) => ({
            selectedCellIds: state.selectedCellIds.filter((cid: string) => cid !== id),
        }));
    },
    clearSelection: () => set({ selectedCellIds: [] }),
});
