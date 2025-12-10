import { Cell } from '../../types/models';
import { saveSettings } from '../../utils/tauri';
import { SCHEMA_VERSION } from './settingsSlice';

export const initialCells: Record<string, Cell> = {
    'root-center': {
        id: 'root-center',
        type: 'launcher_setting',
        cube: { x: 0, y: 0, z: 0 },
        title: 'Settings',
    },
    'root-close': {
        id: 'root-close',
        type: 'group_close',
        cube: { x: 0, y: -1, z: 1 },
        title: 'Close',
    },
    'root-tree': {
        id: 'root-tree',
        type: 'group_tree',
        cube: { x: -1, y: 0, z: 1 },
        title: 'Tree',
    },
};

const initialRootCellIds = ['root-center', 'root-close', 'root-tree'];

/**
 * セル（アプリケーション、ショートカット、ウィジェット等）の管理を行うスライス。
 *
 * CRUD操作（作成、読み取り、更新、削除）および移動操作を提供します。
 * 変更は自動的に `saveSettings` を通じて永続化されます。
 */
export interface CellsSlice {
    cells: Record<string, Cell>;
    rootCellIds: string[];
    addCell: (cell: Cell) => void;
    removeCell: (cellId: string) => void;
    updateCell: (cellId: string, updates: Partial<Cell>) => void;
    moveCell: (cellId: string, newCube: { x: number; y: number; z: number }) => void;
    moveCells: (ids: string[], delta: { x: number; y: number; z: number }) => void;
    swapCells: (cellId1: string, cellId2: string) => void;
}

export const createCellsSlice = (set: any, _get: any): CellsSlice => ({
    cells: initialCells,
    rootCellIds: initialRootCellIds,

    addCell: (cell) => {
        set((state: any) => {
            const newState: any = { cells: { ...state.cells, [cell.id]: cell } };

            if (state.activeGroupId) {
                const group = state.groups[state.activeGroupId];
                if (group) {
                    const updatedGroup = { ...group, cells: [...group.cells, cell.id] };
                    newState.groups = { ...state.groups, [state.activeGroupId]: updatedGroup };
                }
            } else {
                newState.rootCellIds = [...state.rootCellIds, cell.id];
            }

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newState.cells),
                groups: Object.values(newState.groups || state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },

    removeCell: (cellId) => {
        set((state: any) => {
            const cell = state.cells[cellId];
            if (!cell) return state;

            const newState: any = { cells: { ...state.cells }, groups: { ...state.groups } };
            delete newState.cells[cellId];

            // If it's a group folder, delete the group and its contents recursively
            if (cell.type === 'group' && cell.groupId) {
                const deleteGroupRecursive = (groupId: string, currentGroups: any, currentCells: any, currentRootCellIds: string[]) => {
                    const group = currentGroups[groupId];
                    if (!group) return;

                    // Delete all cells in this group
                    group.cells.forEach((childCellId: string) => {
                        const childCell = currentCells[childCellId];
                        if (childCell) {
                            // If child is a group folder, recurse
                            if (childCell.type === 'group' && childCell.groupId) {
                                deleteGroupRecursive(childCell.groupId, currentGroups, currentCells, currentRootCellIds);
                            }
                            delete currentCells[childCellId];
                        }
                    });

                    // Remove group from store
                    delete currentGroups[groupId];
                };

                deleteGroupRecursive(cell.groupId, newState.groups, newState.cells, state.rootCellIds);
            }

            // Remove from parent group or root
            if (state.activeGroupId) {
                const group = newState.groups[state.activeGroupId];
                if (group) {
                    newState.groups[state.activeGroupId] = {
                        ...group,
                        cells: group.cells.filter((id: string) => id !== cellId)
                    };
                }
            } else {
                newState.rootCellIds = state.rootCellIds.filter((id: string) => id !== cellId);
            }

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newState.cells),
                groups: Object.values(newState.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);

            return newState;
        });
    },

    updateCell: (cellId, updates) => {
        set((state: any) => {
            const cell = state.cells[cellId];
            if (!cell) return state;

            const newState = {
                cells: { ...state.cells, [cellId]: { ...cell, ...updates } }
            };

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newState.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);

            return newState;
        });
    },

    moveCell: (cellId, newCube) => {
        set((state: any) => {
            const cell = state.cells[cellId];
            if (!cell) return state;

            const newState = {
                cells: { ...state.cells, [cellId]: { ...cell, cube: newCube } }
            };

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newState.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);

            return newState;
        });
    },

    moveCells: (ids, delta) => {
        set((state: any) => {
            const newCells = { ...state.cells };
            ids.forEach((id: string) => {
                const cell = newCells[id];
                if (cell) {
                    newCells[id] = {
                        ...cell,
                        cube: {
                            x: cell.cube.x + delta.x,
                            y: cell.cube.y + delta.y,
                            z: cell.cube.z + delta.z,
                        },
                    };
                }
            });

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newCells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);

            return { cells: newCells };
        });
    },

    swapCells: (cellId1: string, cellId2: string) => {
        set((state: any) => {
            const cell1 = state.cells[cellId1];
            const cell2 = state.cells[cellId2];

            if (!cell1 || !cell2) return state;

            const newCells = {
                ...state.cells,
                [cellId1]: { ...cell1, cube: cell2.cube },
                [cellId2]: { ...cell2, cube: cell1.cube }
            };

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newCells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);

            return { cells: newCells };
        });
    },
});
