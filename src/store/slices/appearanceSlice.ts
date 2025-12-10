import { AppearanceSettings } from '../../types/models';

export interface AppearanceSlice {
    appearance: AppearanceSettings;
    /** 外観設定を更新し、設定ファイルに保存します */
    setAppearance: (settings: Partial<AppearanceSettings>) => void;
    /** 外観設定をデフォルトに戻します */
    resetAppearance: () => void;
}

/**
 * アプリケーションの外観（テーマ、透過度、スタイル）を管理するスライス。
 */

const DEFAULT_APPEARANCE: AppearanceSettings = {
    opacity: 0.9,
    themeColor: 'cyan',
    style: 'default',
    searchScope: 'global',
    searchMode: 'fuzzy',
    enableIconSilhouette: false,
    enableVFX: true,
    vfxIntensity: 0.5,
};

export const createAppearanceSlice = (set: any, _get: any): AppearanceSlice => ({
    appearance: DEFAULT_APPEARANCE,
    setAppearance: (settings) => {
        set((state: any) => {
            const newAppearance = { ...state.appearance, ...settings };
            // Save settings will be called from the combined store
            return { appearance: newAppearance };
        });
    },
    resetAppearance: () => {
        set(() => ({ appearance: DEFAULT_APPEARANCE }));
    },
});
