import { saveSettings } from '../../utils/tauri';
import { SCHEMA_VERSION } from './settingsSlice';

export interface SearchSlice {
    isSearchActive: boolean;
    searchQuery: string;
    searchResults: string[]; // Matched cell IDs
    searchHistory: string[];

    setSearchActive: (active: boolean) => void;
    setSearchQuery: (query: string) => void;
    setSearchResults: (results: string[]) => void;
    addToSearchHistory: (query: string) => void;
    clearSearchHistory: () => void;
}

const MAX_HISTORY = 10;

export const createSearchSlice = (set: any, _get: any): SearchSlice => ({
    isSearchActive: false,
    searchQuery: '',
    searchResults: [],
    searchHistory: [],

    setSearchActive: (active) => {
        set({ isSearchActive: active });
        if (!active) {
            // Clear search when closing
            set({ searchQuery: '', searchResults: [] });
        }
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },

    setSearchResults: (results) => {
        set({ searchResults: results });
    },

    addToSearchHistory: (query) => {
        if (!query.trim()) return;

        set((state: any) => {
            const history = state.searchHistory || [];
            // Remove duplicates and add to front
            const newHistory = [
                query,
                ...history.filter((q: string) => q !== query)
            ].slice(0, MAX_HISTORY);

            const newState = { searchHistory: newHistory };

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
                searchHistory: newHistory,
            }).catch(console.error);

            return newState;
        });
    },

    clearSearchHistory: () => {
        set((state: any) => {
            const newState = { searchHistory: [] };
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
                searchHistory: [],
            }).catch(console.error);
            return newState;
        });
    },
});
