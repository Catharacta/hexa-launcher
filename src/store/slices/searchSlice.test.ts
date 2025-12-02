import { createSearchSlice } from './searchSlice';

// Mock saveSettings
jest.mock('../../utils/tauri', () => ({
    saveSettings: jest.fn(() => Promise.resolve()),
}));

jest.mock('./settingsSlice', () => ({
    SCHEMA_VERSION: 1,
}));

describe('searchSlice', () => {
    let store: ReturnType<typeof createSearchSlice>;
    let setState: jest.Mock;
    let getState: jest.Mock;

    beforeEach(() => {
        setState = jest.fn((fn) => {
            const newState = typeof fn === 'function' ? fn(getState()) : fn;
            if (typeof newState === 'object') {
                Object.assign(getState(), newState);
            }
            return newState;
        });

        getState = jest.fn(() => ({
            isSearchActive: false,
            searchQuery: '',
            searchResults: [],
            searchHistory: [],
            cells: {},
            groups: {},
            activeGroupId: null,
            appearance: {},
            general: {},
            grid: {},
            security: {},
            advanced: {},
            hotkeys: {},
            iconCacheIndex: {},
            keyBindings: {},
        }));

        store = createSearchSlice(setState as any, getState as any);
    });

    describe('setSearchActive', () => {
        it('activates search', () => {
            store.setSearchActive(true);

            expect(setState).toHaveBeenCalledWith({ isSearchActive: true });
        });

        it('deactivates search and clears query', () => {
            store.setSearchActive(false);

            expect(setState).toHaveBeenCalledWith({ isSearchActive: false });
            expect(setState).toHaveBeenCalledWith({ searchQuery: '', searchResults: [] });
        });
    });

    describe('addToSearchHistory', () => {
        it('adds query to history', () => {
            store.addToSearchHistory('new search');

            expect(setState).toHaveBeenCalled();
        });

        it('does not add empty query', () => {
            store.addToSearchHistory('   ');

            expect(setState).not.toHaveBeenCalled();
        });
    });

    describe('clearSearchHistory', () => {
        it('clears all search history', () => {
            getState.mockReturnValue({
                ...getState(),
                searchHistory: ['search 1', 'search 2'],
            });

            store.clearSearchHistory();

            expect(setState).toHaveBeenCalled();
        });
    });
});
