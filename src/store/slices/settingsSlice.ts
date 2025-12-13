import { Settings, Cell, Group, GeneralSettings, GridSettings, SecuritySettings, AdvancedSettings } from '../../types/models';
import { initialCells } from './cellsSlice';
import { updateGlobalShortcut, saveSettings } from '../../utils/tauri';
import { debounce } from '../../utils/debounce';

/**
 * アプリケーション全体の統合設定を管理するスライス。
 *
 * 各カテゴリ（一般、グリッド、セキュリティ、高度な設定）ごとの設定更新アクションや
 * 設定ファイルからのロード機能 (`loadFromSettings`) を提供します。
 * また、状態変更時に `saveSettings` を呼び出して永続化も行います。
 */
export interface SettingsSlice {
    hotkeys: Record<string, string>;
    iconCacheIndex: Record<string, string>;
    general: GeneralSettings;
    grid: GridSettings;
    security: SecuritySettings;
    advanced: AdvancedSettings;
    /** 設定オブジェクト全体をロードしてストアに適用します */
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
    selectCenterOnBoot: true,
    windowBehavior: {
        alwaysOnTop: false,
        hideOnBlur: false,
        showOnMouseEdge: false,
    },
};

const DEFAULT_GRID_SETTINGS: GridSettings = {
    hexSize: 60,
    gapSize: 8,
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

// Debounced saver instance
// 1 second delay to batch rapid changes (e.g. sliders)
const debouncedSave = debounce((state: any) => {
    saveSettings({
        schemaVersion: SCHEMA_VERSION,
        cells: Object.values(state.cells),
        groups: Object.values(state.groups),
        activeGroupId: state.activeGroupId,
        appearance: state.appearance,
        general: state.general,
        grid: state.grid,
        security: state.security,
        advanced: state.advanced,
        hotkeys: state.hotkeys,
        iconCacheIndex: state.iconCacheIndex,
        keyBindings: state.keyBindings,
    }).catch(console.error);
}, 1000);

// Helper to trigger save from setters
const triggerSave = (get: any) => {
    debouncedSave(get());
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
                ...settings.keyBindings
            } : get().keyBindings,
            searchHistory: settings.searchHistory || [],
            rootCellIds: finalRootCellIds,
            // Apply initial selection based on settings (defaults to true if undefined)
            selectedCellIds: (settings.general?.selectCenterOnBoot ?? true) ? ['root-center'] : [],
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
            return { general: newGeneral };
        });
        triggerSave(get);
    },

    setGridSettings: (settings) => {
        set((state: any) => {
            const newGrid = { ...state.grid, ...settings };
            return { grid: newGrid };
        });
        triggerSave(get);
    },

    resetGeneralSettings: () => {
        set(() => {
            return { general: DEFAULT_GENERAL_SETTINGS };
        });
        triggerSave(get);
    },

    resetGridSettings: () => {
        set(() => {
            return { grid: DEFAULT_GRID_SETTINGS };
        });
        triggerSave(get);
    },

    setSecuritySettings: (settings) => {
        set((state: any) => {
            const newSecurity = { ...state.security, ...settings };
            return { security: newSecurity };
        });
        triggerSave(get);
    },

    resetSecuritySettings: () => {
        set(() => {
            return { security: DEFAULT_SECURITY_SETTINGS };
        });
        triggerSave(get);
    },

    setAdvancedSettings: (settings) => {
        set((state: any) => {
            const newAdvanced = { ...state.advanced, ...settings };
            return { advanced: newAdvanced };
        });
        triggerSave(get);
    },

    resetAdvancedSettings: () => {
        set(() => {
            return { advanced: DEFAULT_ADVANCED_SETTINGS };
        });
        triggerSave(get);
    },
});

export { SCHEMA_VERSION };
