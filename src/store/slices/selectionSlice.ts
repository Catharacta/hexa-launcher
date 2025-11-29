export interface SelectionSlice {
    selectedCellIds: string[];
    selectCell: (id: string, multi: boolean) => void;
    deselectCell: (id: string) => void;
    clearSelection: () => void;
}

export const createSelectionSlice = (set: any, _get: any): SelectionSlice => ({
    selectedCellIds: [],
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
