import { Settings, Cell, Group } from '../../types/models';
import { initialCells } from './cellsSlice';
import { updateGlobalShortcut } from '../../utils/tauri';

export interface SettingsSlice {
    hotkeys: Record<string, string>;
    iconCacheIndex: Record<string, string>;
    loadFromSettings: (settings: Settings) => void;
    getCellsInActiveGroup: () => Cell[];
}

const SCHEMA_VERSION = 1;

export const createSettingsSlice = (set: any, get: any): SettingsSlice => ({
    hotkeys: {},
    iconCacheIndex: {},

    loadFromSettings: (settings) => {
        const cellsMap: Record<string, Cell> = { ...initialCells };
        settings.cells?.forEach((c: Cell) => {
            cellsMap[c.id] = c;
        });

        const groupsMap: Record<string, Group> = {};
        settings.groups?.forEach((g: Group) => {
            groupsMap[g.id] = g;
        });

        const rootCellIds = settings.cells
            ?.filter((cid: Cell) => !settings.groups?.some((g: Group) => g.cells.includes(cid.id)))
            .map((c: Cell) => c.id) || [];

        const systemCellIds = ['root-center', 'root-close', 'root-tree'];
        const finalRootCellIds = systemCellIds.concat(rootCellIds.filter((id: string) => !systemCellIds.includes(id)));

        if (settings.keyBindings?.globalToggle) {
            updateGlobalShortcut(settings.keyBindings.globalToggle);
        }

        set({
            cells: cellsMap,
            groups: groupsMap,
            activeGroupId: settings.activeGroupId || null,
            appearance: settings.appearance || get().appearance,
            hotkeys: settings.hotkeys || {},
            iconCacheIndex: settings.iconCacheIndex || {},
            keyBindings: settings.keyBindings ? {
                ...get().keyBindings,
                ...settings.keyBindings,
                hexNav: {
                    ...get().keyBindings.hexNav,
                    ...(settings.keyBindings.hexNav || {})
                },
                actions: {
                    ...get().keyBindings.actions,
                    ...(settings.keyBindings.actions || {})
                }
            } : get().keyBindings,
            rootCellIds: finalRootCellIds,
        });
    },

    getCellsInActiveGroup: () => {
        const state = get();
        const activeGroupId = state.activeGroupId;
        if (!activeGroupId) {
            return state.rootCellIds.map((id: string) => state.cells[id]).filter(Boolean);
        }
        const group = state.groups[activeGroupId];
        return group?.cells.map((id: string) => state.cells[id]).filter(Boolean) || [];
    },
});

export { SCHEMA_VERSION };
