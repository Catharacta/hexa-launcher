import { create } from 'zustand';
import { Cell, Group, Settings, AppearanceSettings } from '../types/models';
import { saveSettings } from '../utils/tauri';

interface LauncherState {
    cells: Record<string, Cell>;
    groups: Record<string, Group>;
    activeGroupId: string | null;
    isSettingsOpen: boolean;
    treeModalOpen: boolean;
    appearance: AppearanceSettings;
    hotkeys: Record<string, string>;
    iconCacheIndex: Record<string, string>;
    selectedCellIds: string[];
    rootCellIds: string[];

    // CRUD
    addCell: (cell: Cell) => void;
    removeCell: (cellId: string) => void;
    updateCell: (cellId: string, updates: Partial<Cell>) => void;
    addGroup: (group: Group) => void;

    // Group actions
    createGroupFolder: (name: string, locationCellId?: string) => void;
    renameGroup: (groupId: string, newName: string) => void;
    duplicateCell: (cellId: string) => void;
    deleteGroup: (groupId: string) => void;
    getGroupProperties: (groupId: string) => Group | undefined;

    // Settings
    loadFromSettings: (settings: Settings) => void;
    setActiveGroup: (groupId: string | null) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    setTreeModalOpen: (isOpen: boolean) => void;
    navigateToGroup: (groupId: string | null) => void;
    setAppearance: (settings: Partial<AppearanceSettings>) => void;
    getCellsInActiveGroup: () => Cell[];

    // Movement
    moveCell: (cellId: string, newCube: { x: number; y: number; z: number }) => void;
    moveCellToGroup: (cellId: string, targetGroupId: string) => void;
    moveGroup: (groupId: string, delta: { x: number; y: number; z: number }) => void;
    moveCells: (ids: string[], delta: { x: number; y: number; z: number }) => void;

    // Selection
    selectCell: (id: string, multi: boolean) => void;
    deselectCell: (id: string) => void;
    clearSelection: () => void;
}

const initialCells: Record<string, Cell> = {
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

const SCHEMA_VERSION = 1;

export const useLauncherStore = create<LauncherState>((set, get) => ({
    // State
    cells: initialCells,
    groups: {},
    activeGroupId: null,
    isSettingsOpen: false,
    treeModalOpen: false,
    appearance: { opacity: 0.9, themeColor: 'cyan', style: 'default' },
    hotkeys: {},
    iconCacheIndex: {},
    selectedCellIds: [],
    rootCellIds: initialRootCellIds,

    // --- CRUD ---
    addCell: (cell) => {
        set((state) => {
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
            }).catch(console.error);
            return newState;
        });
    },

    removeCell: (cellId) => {
        set((state) => {
            const cell = state.cells[cellId];
            if (!cell) return state;

            const newState: any = { cells: { ...state.cells }, groups: { ...state.groups } };
            delete newState.cells[cellId];

            // If it's a group folder, delete the group and its contents recursively
            if (cell.type === 'group' && cell.groupId) {
                const deleteGroupRecursive = (groupId: string, currentGroups: Record<string, Group>, currentCells: Record<string, Cell>, currentRootCellIds: string[]) => {
                    const group = currentGroups[groupId];
                    if (!group) return;

                    // Delete all cells in this group
                    group.cells.forEach(childCellId => {
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
                newState.rootCellIds = state.rootCellIds.filter(id => id !== cellId);
            }

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newState.cells),
                groups: Object.values(newState.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
            }).catch(console.error);

            return newState;
        });
    },

    updateCell: (cellId, updates) => {
        set((state) => {
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
            }).catch(console.error);

            return newState;
        });
    },

    addGroup: (group) => {
        set((state) => {
            const newState = { groups: { ...state.groups, [group.id]: group } };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(newState.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
            }).catch(console.error);
            return newState;
        });
    },

    // --- Group Actions ---
    createGroupFolder: (name, locationCellId) => {
        set((state) => {
            const newGroupId = crypto.randomUUID();
            const newGroup: Group = {
                id: newGroupId,
                title: name,
                cells: [],
                parentId: state.activeGroupId ?? undefined
            };

            const newCellId = crypto.randomUUID();
            const newCell: Cell = {
                id: newCellId,
                type: 'group',
                cube: { x: 0, y: 0, z: 0 }, // Should find empty spot
                title: name,
                groupId: newGroupId
            };

            // Add group and cell
            const newState: any = {
                groups: { ...state.groups, [newGroupId]: newGroup },
                cells: { ...state.cells, [newCellId]: newCell }
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
            }).catch(console.error);

            return newState;
        });
    },

    renameGroup: (groupId, newName) => {
        set((state) => {
            const group = state.groups[groupId];
            if (!group) return state;

            const newGroups = { ...state.groups, [groupId]: { ...group, title: newName } };
            let newCells = { ...state.cells };

            // Also rename the folder cell
            const folderCell = Object.values(state.cells).find(c => c.type === 'group' && c.groupId === groupId);
            if (folderCell) {
                newCells[folderCell.id] = { ...folderCell, title: newName };
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
            }).catch(console.error);

            return newState;
        });
    },

    duplicateCell: (cellId) => {
        // Implementation omitted for brevity
    },

    deleteGroup: (groupId) => {
        set((state) => {
            const newState: any = { cells: { ...state.cells }, groups: { ...state.groups } };

            const deleteGroupRecursive = (targetGroupId: string) => {
                const group = newState.groups[targetGroupId];
                if (!group) return;

                // Delete all cells in this group
                group.cells.forEach((childCellId: string) => {
                    const childCell = newState.cells[childCellId];
                    if (childCell) {
                        if (childCell.type === 'group' && childCell.groupId) {
                            deleteGroupRecursive(childCell.groupId);
                        }
                        delete newState.cells[childCellId];
                    }
                });

                delete newState.groups[targetGroupId];
            };

            deleteGroupRecursive(groupId);

            // Also remove the folder cell that points to this group
            const folderCell = Object.values(state.cells).find(c => c.type === 'group' && c.groupId === groupId);
            if (folderCell) {
                delete newState.cells[folderCell.id];

                // Remove from parent list
                if (state.activeGroupId) {
                    const parentGroup = newState.groups[state.activeGroupId];
                    if (parentGroup) {
                        newState.groups[state.activeGroupId] = {
                            ...parentGroup,
                            cells: parentGroup.cells.filter((id: string) => id !== folderCell.id)
                        };
                    }
                } else {
                    newState.rootCellIds = state.rootCellIds.filter(id => id !== folderCell.id);
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
            }).catch(console.error);

            return newState;
        });
    },

    getGroupProperties: (groupId) => get().groups[groupId],

    // --- Settings ---
    loadFromSettings: (settings) => {
        // Transform array to record
        const cellsRecord: Record<string, Cell> = {};
        settings.cells.forEach(c => { cellsRecord[c.id] = c; });

        const groupsRecord: Record<string, Group> = {};
        (settings.groups || []).forEach(g => { groupsRecord[g.id] = g; });

        // Reconstruct rootCellIds
        const allGroupCellIds = new Set<string>();
        Object.values(groupsRecord).forEach(g => g.cells.forEach(cid => allGroupCellIds.add(cid)));

        const rootCellIds = settings.cells
            .filter(c => !allGroupCellIds.has(c.id))
            .map(c => c.id);

        set({
            cells: cellsRecord,
            groups: groupsRecord,
            activeGroupId: settings.activeGroupId,
            appearance: settings.appearance || { opacity: 0.9, themeColor: 'cyan', style: 'default' },
            hotkeys: settings.hotkeys || {},
            iconCacheIndex: settings.iconCacheIndex || {},
            rootCellIds: rootCellIds,
        });
    },

    setActiveGroup: (groupId) => {
        set((state) => {
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: groupId, // Save the new active group
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
            }).catch(console.error);
            return { activeGroupId: groupId, selectedCellIds: [] };
        });
    },

    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),

    setTreeModalOpen: (isOpen) => set({ treeModalOpen: isOpen }),

    navigateToGroup: (groupId) => {
        set({ activeGroupId: groupId, treeModalOpen: false });
    },

    setAppearance: (settings) => {
        set((state) => {
            const newAppearance = { ...state.appearance, ...settings };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: newAppearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
            }).catch(console.error);
            return { appearance: newAppearance };
        });
    },

    getCellsInActiveGroup: () => {
        const state = get();
        if (state.activeGroupId) {
            const group = state.groups[state.activeGroupId];
            if (!group) return [];
            return group.cells.map(id => state.cells[id]).filter(Boolean);
        } else {
            return state.rootCellIds.map(id => state.cells[id]).filter(Boolean);
        }
    },

    moveCell: (cellId, newCube) => {
        set((state) => {
            const cell = state.cells[cellId];
            if (!cell) return state;

            const newState = {
                cells: {
                    ...state.cells,
                    [cellId]: { ...cell, cube: newCube }
                }
            };

            // Auto-save
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newState.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
            }).catch(console.error);

            return newState;
        });
    },

    moveCellToGroup: (cellId, targetGroupId) => {
        set((state) => {
            const cell = state.cells[cellId];
            if (!cell) return state;

            // Prevent moving system cells
            if (['launcher_setting', 'group_back', 'group_close', 'group_tree'].includes(cell.type)) {
                return state;
            }

            const newState: any = { cells: { ...state.cells }, groups: { ...state.groups } };

            // 1. Remove from current context
            if (state.activeGroupId) {
                const currentGroup = newState.groups[state.activeGroupId];
                newState.groups[state.activeGroupId] = {
                    ...currentGroup,
                    cells: currentGroup.cells.filter((id: string) => id !== cellId)
                };
            } else {
                newState.rootCellIds = state.rootCellIds.filter(id => id !== cellId);
            }

            // 2. Add to target group
            const targetGroup = newState.groups[targetGroupId];
            if (targetGroup) {
                // Find a free spot in the target group?
                // For now, just reset coordinates to 0,0,0 (or near it) and let user arrange.
                // Or keep relative position if it makes sense? No, different context.
                // Let's put it at 1,1,1 or something to avoid overlap with center.
                // Better: Find first empty spot logic again.
                // Simplified: x: 2, y: 0, z: -2 (Just somewhere)
                newState.cells[cellId] = { ...cell, cube: { x: 2, y: 0, z: -2 } };

                newState.groups[targetGroupId] = {
                    ...targetGroup,
                    cells: [...targetGroup.cells, cellId]
                };
            }

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newState.cells),
                groups: Object.values(newState.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
            }).catch(console.error);

            return newState;
        });
    },

    moveGroup: (groupId, delta) => {
        set((state) => {
            // Moving a group means moving the folder cell that represents it.
            // Find the folder cell
            const folderCell = Object.values(state.cells).find(c => c.type === 'group' && c.groupId === groupId);
            if (!folderCell) return state;

            const newCube = {
                x: folderCell.cube.x + delta.x,
                y: folderCell.cube.y + delta.y,
                z: folderCell.cube.z + delta.z,
            };

            const newState = {
                cells: {
                    ...state.cells,
                    [folderCell.id]: { ...folderCell, cube: newCube }
                }
            };

            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(newState.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
            }).catch(console.error);

            return newState;
        });
    },

    moveCells: (ids, delta) => {
        set((state) => {
            const newCells = { ...state.cells };
            ids.forEach(id => {
                const cell = newCells[id];
                if (cell) {
                    newCells[id] = {
                        ...cell,
                        cube: {
                            x: cell.cube.x + delta.x,
                            y: cell.cube.y + delta.y,
                            z: cell.cube.z + delta.z,
                        }
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
            }).catch(console.error);

            return { cells: newCells };
        });
    },

    selectCell: (id, multi) => {
        set((state) => {
            if (multi) {
                if (state.selectedCellIds.includes(id)) {
                    return { selectedCellIds: state.selectedCellIds.filter(cid => cid !== id) };
                } else {
                    return { selectedCellIds: [...state.selectedCellIds, id] };
                }
            } else {
                return { selectedCellIds: [id] };
            }
        });
    },

    deselectCell: (id) => {
        set((state) => ({
            selectedCellIds: state.selectedCellIds.filter(cid => cid !== id)
        }));
    },

    clearSelection: () => {
        set({ selectedCellIds: [] });
    },
}));