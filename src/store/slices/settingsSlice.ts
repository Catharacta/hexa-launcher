import { Settings, Cell, Group, GeneralSettings, GridSettings, SecuritySettings, AdvancedSettings } from '../../types/models';
import { initialCells } from './cellsSlice';
import { updateGlobalShortcut, saveSettings } from '../../utils/tauri';

export interface SettingsSlice {
    hotkeys: Record<string, string>;
    iconCacheIndex: Record<string, string>;
    general: GeneralSettings;
    grid: GridSettings;
    security: SecuritySettings;
    advanced: AdvancedSettings;
    loadFromSettings: (settings: Settings) => void;
    getCellsInActiveGroup: () => Cell[];
    setGeneralSettings: (settings: Partial<GeneralSettings>) => void;
    setGridSettings: (settings: Partial<GridSettings>) => void;
    setSecuritySettings: (settings: Partial<SecuritySettings>) => void;
    setAdvancedSettings: (settings: Partial<AdvancedSettings>) => void;
    resetGeneralSettings: () => void;
    resetGridSettings: () => void;
    resetSecuritySettings: () => void;
    resetAdvancedSettings: () => void;
}

const SCHEMA_VERSION = 1;

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
    startOnBoot: false,
    language: 'en',
    windowBehavior: {
        alwaysOnTop: false,
        hideOnBlur: false,
        showOnMouseEdge: false,
    },
};

const DEFAULT_GRID_SETTINGS: GridSettings = {
    hexSize: 60,
    gapSize: 0,
    animationSpeed: 'normal',
    showLabels: 'hover',
    hoverEffect: true,
    enableAnimations: true,
};

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
    requireAdminConfirmation: true,
    showLaunchConfirmation: false,
    trustedPaths: [],
};

const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
    debugMode: false,
    showPerformanceMetrics: false,
    customCSS: '',
    disableAnimations: false,
};

export const createSettingsSlice = (set: any, get: any): SettingsSlice => ({
    hotkeys: {},
    iconCacheIndex: {},
    general: DEFAULT_GENERAL_SETTINGS,
    grid: DEFAULT_GRID_SETTINGS,
    security: DEFAULT_SECURITY_SETTINGS,
    advanced: DEFAULT_ADVANCED_SETTINGS,

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
            general: { ...DEFAULT_GENERAL_SETTINGS, ...settings.general },
            grid: { ...DEFAULT_GRID_SETTINGS, ...settings.grid },
            security: { ...DEFAULT_SECURITY_SETTINGS, ...settings.security },
            advanced: { ...DEFAULT_ADVANCED_SETTINGS, ...settings.advanced },
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

    setGeneralSettings: (settings) => {
        set((state: any) => {
            const newGeneral = { ...state.general, ...settings };
            const newState = { general: newGeneral };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: newGeneral,
                grid: state.grid,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },

    setGridSettings: (settings) => {
        set((state: any) => {
            const newGrid = { ...state.grid, ...settings };
            const newState = { grid: newGrid };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: state.general,
                grid: newGrid,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },

    resetGeneralSettings: () => {
        set((state: any) => {
            const newState = { general: DEFAULT_GENERAL_SETTINGS };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: DEFAULT_GENERAL_SETTINGS,
                grid: state.grid,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },

    resetGridSettings: () => {
        set((state: any) => {
            const newState = { grid: DEFAULT_GRID_SETTINGS };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: state.general,
                grid: DEFAULT_GRID_SETTINGS,
                security: state.security,
                advanced: state.advanced,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },

    setSecuritySettings: (settings) => {
        set((state: any) => {
            const newSecurity = { ...state.security, ...settings };
            const newState = { security: newSecurity };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: state.general,
                grid: state.grid,
                security: newSecurity,
                advanced: state.advanced,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },

    resetSecuritySettings: () => {
        set((state: any) => {
            const newState = { security: DEFAULT_SECURITY_SETTINGS };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: state.general,
                grid: state.grid,
                security: DEFAULT_SECURITY_SETTINGS,
                advanced: state.advanced,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },

    setAdvancedSettings: (settings) => {
        set((state: any) => {
            const newAdvanced = { ...state.advanced, ...settings };
            const newState = { advanced: newAdvanced };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: state.general,
                grid: state.grid,
                security: state.security,
                advanced: newAdvanced,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },

    resetAdvancedSettings: () => {
        set((state: any) => {
            const newState = { advanced: DEFAULT_ADVANCED_SETTINGS };
            saveSettings({
                schemaVersion: SCHEMA_VERSION,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: state.general,
                grid: state.grid,
                security: state.security,
                advanced: DEFAULT_ADVANCED_SETTINGS,
                hotkeys: state.hotkeys,
                iconCacheIndex: state.iconCacheIndex,
                keyBindings: state.keyBindings,
            }).catch(console.error);
            return newState;
        });
    },
});

export { SCHEMA_VERSION };
