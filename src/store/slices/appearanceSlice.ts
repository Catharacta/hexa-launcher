import { AppearanceSettings } from '../../types/models';

export interface AppearanceSlice {
    appearance: AppearanceSettings;
    setAppearance: (settings: Partial<AppearanceSettings>) => void;
}

export const createAppearanceSlice = (set: any, _get: any): AppearanceSlice => ({
    appearance: {
        opacity: 0.9,
        themeColor: 'cyan',
        style: 'default',
        searchScope: 'global',
        searchMode: 'fuzzy',
    },
    setAppearance: (settings) => {
        set((state: any) => {
            const newAppearance = { ...state.appearance, ...settings };
            // Save settings will be called from the combined store
            return { appearance: newAppearance };
        });
    },
});
