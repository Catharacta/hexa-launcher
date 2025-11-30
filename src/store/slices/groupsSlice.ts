import { Group, Cell } from '../../types/models';
import { saveSettings } from '../../utils/tauri';
import { SCHEMA_VERSION } from './settingsSlice';
import { createDefaultGroupCells, deleteGroupRecursive } from '../../utils/groupUtils';
import { findEmptyAdjacentCube, cubeKey } from '../../utils/hexUtils';

export interface GroupsSlice {
    groups: Record<string, Group>;
    activeGroupId: string | null;
    createGroupFolder: (name: string, locationCellId?: string) => void;
    renameGroup: (groupId: string, newName: string) => void;
    duplicateCell: (cellId: string) => void;
    deleteGroup: (groupId: string) => void;
    getGroupProperties: (groupId: string) => Group | undefined;
    addGroup: (group: Group) => void;
    setActiveGroup: (groupId: string | null) => void;
    navigateToGroup: (groupId: string | null) => void;
    moveCellToGroup: (cellId: string, targetGroupId: string) => void;
    moveGroup: (groupId: string, delta: { x: number; y: number; z: number }) => void;
}

export const createGroupsSlice = (set: any, get: any): GroupsSlice => ({
    groups: {},
    activeGroupId: null,

    addGroup: (group) => {
        set((state: any) => {
            const newState = { groups: { ...state.groups, [group.id]: group } };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
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

    createGroupFolder: (name, locationCellId) => {
        set((state: any) => {
            const newGroupId = crypto.randomUUID();
            const { ids: defaultCellIds, cells: defaultCellsList } = createDefaultGroupCells();

            // Check if we should convert an existing cell or create a new one
            const locationCell = locationCellId ? state.cells[locationCellId] : null;

            if (locationCell && locationCell.type !== 'launcher_setting' &&
                locationCell.type !== 'group_back' && locationCell.type !== 'group_close' &&
                locationCell.type !== 'group_tree' && locationCell.type !== 'group') {
                // Convert the existing cell to a group cell
                // First, create a copy of the original cell to put inside the group
                const originalCellCopy: Cell = {
                    ...locationCell,
                    id: crypto.randomUUID(),
                    cube: { x: 1, y: 0, z: -1 }, // Position inside the group
                };

                const newGroup: Group = {
                    id: newGroupId,
                    title: name,
                    cells: [...defaultCellIds, originalCellCopy.id],
                    parentId: state.activeGroupId ?? undefined
                };

                // Convert the location cell to a group cell
                const groupCell: Cell = {
                    ...locationCell,
                    type: 'group',
                    title: name,
                    groupId: newGroupId,
                    // Remove shortcut-specific fields
                    shortcut: undefined,
                    target: undefined,
                    args: undefined,
                    workingDir: undefined,
                };

                const newState: any = {
                    groups: { ...state.groups, [newGroupId]: newGroup },
                    cells: {
                        ...state.cells,
                        [locationCell.id]: groupCell,
                        [originalCellCopy.id]: originalCellCopy,
                        // Add default system cells
                        ...Object.fromEntries(defaultCellsList.map(cell => [cell.id, cell]))
                    }
                };

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
            } else {
                // Original behavior: create a new group cell at an adjacent position
                const newGroup: Group = {
                    id: newGroupId,
                    title: name,
                    cells: defaultCellIds,
                    parentId: state.activeGroupId ?? undefined
                };

                // Find position for the new group cell
                let newCellCube = { x: 0, y: 0, z: 0 };

                if (locationCell) {
                    // Get all occupied positions in current view
                    const occupiedPositions = new Set<string>();
                    const cellsToCheck = state.activeGroupId
                        ? state.groups[state.activeGroupId]?.cells.map((id: string) => state.cells[id]) || []
                        : state.rootCellIds.map((id: string) => state.cells[id]);

                    cellsToCheck.forEach((cell: any) => {
                        if (cell) {
                            occupiedPositions.add(cubeKey(cell.cube));
                        }
                    });

                    newCellCube = findEmptyAdjacentCube(locationCell.cube, occupiedPositions);
                }

                const newCellId = crypto.randomUUID();
                const newCell: Cell = {
                    id: newCellId,
                    type: 'group',
                    cube: newCellCube,
                    title: name,
                    groupId: newGroupId
                };

                const newState: any = {
                    groups: { ...state.groups, [newGroupId]: newGroup },
                    cells: {
                        ...state.cells,
                        [newCellId]: newCell,
                        // Add default system cells
                        ...Object.fromEntries(defaultCellsList.map(cell => [cell.id, cell]))
                    }
                };

                if (state.activeGroupId) {
                    const currentGroup = newState.groups[state.activeGroupId];
                    newState.groups[state.activeGroupId] = {
                        ...currentGroup,
                        cells: [...currentGroup.cells, newCellId]
                    };
                } else {
                    newState.rootCellIds = [...state.rootCellIds, newCellId];
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
            }
        });
    },

    renameGroup: (groupId, newName) => {
        set((state: any) => {
            const group = state.groups[groupId];
            if (!group) return state;

            const newGroups = { ...state.groups, [groupId]: { ...group, title: newName } };
            let newCells = { ...state.cells };

            const folderCell = Object.values(state.cells).find((c: any) => c.type === 'group' && c.groupId === groupId);
            if (folderCell) {
                newCells[(folderCell as Cell).id] = { ...folderCell, title: newName };
            }

            const newState = {
                groups: newGroups,
                cells: newCells
            };

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

    duplicateCell: (_cellId) => {
        // Implementation omitted for brevity
    },

    deleteGroup: (groupId) => {
        set((state: any) => {
            const newState: any = { cells: { ...state.cells }, groups: { ...state.groups } };

            deleteGroupRecursive(groupId, newState.groups, newState.cells);

            const folderCell = Object.values(state.cells).find((c: any) => c.type === 'group' && c.groupId === groupId);
            if (folderCell) {
                delete newState.cells[(folderCell as Cell).id];

                if (state.activeGroupId) {
                    const parentGroup = newState.groups[state.activeGroupId];
                    if (parentGroup) {
                        newState.groups[state.activeGroupId] = {
                            ...parentGroup,
                            cells: parentGroup.cells.filter((id: string) => id !== (folderCell as Cell).id)
                        };
                    }
                } else {
                    newState.rootCellIds = state.rootCellIds.filter((id: string) => id !== (folderCell as Cell).id);
                }
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

    getGroupProperties: (groupId) => {
        return get().groups[groupId];
    },

    setActiveGroup: (groupId) => {
        set((state: any) => {
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: groupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return { activeGroupId: groupId };
        });
    },

    navigateToGroup: (groupId) => {
        set({ activeGroupId: groupId });
    },

    moveCellToGroup: (cellId, targetGroupId) => {
        set((state: any) => {
            const cell = state.cells[cellId];
            if (!cell) return state;

            const newState: any = { groups: { ...state.groups } };

            if (state.activeGroupId) {
                const sourceGroup = newState.groups[state.activeGroupId];
                if (sourceGroup) {
                    newState.groups[state.activeGroupId] = {
                        ...sourceGroup,
                        cells: sourceGroup.cells.filter((id: string) => id !== cellId)
                    };
                }
            } else {
                newState.rootCellIds = state.rootCellIds.filter((id: string) => id !== cellId);
            }

            const targetGroup = newState.groups[targetGroupId];
            if (targetGroup) {
                newState.groups[targetGroupId] = {
                    ...targetGroup,
                    cells: [...targetGroup.cells, cellId]
                };
            }

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
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

    moveGroup: (groupId, delta) => {
        set((state: any) => {
            const group = state.groups[groupId];
            if (!group) return state;

            const cellsInGroup = group.cells.map((id: string) => state.cells[id]).filter(Boolean);
            const newCells = { ...state.cells };

            cellsInGroup.forEach((cell: Cell) => {
                newCells[cell.id] = {
                    ...cell,
                    cube: {
                        x: cell.cube.x + delta.x,
                        y: cell.cube.y + delta.y,
                        z: cell.cube.z + delta.z,
                    },
                };
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
});
