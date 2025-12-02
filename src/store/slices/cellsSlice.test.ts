import { createCellsSlice } from './cellsSlice';
import { Cell } from '../../types/models';

// Mock saveSettings
jest.mock('../../utils/tauri', () => ({
    saveSettings: jest.fn(() => Promise.resolve()),
}));

describe('cellsSlice', () => {
    let store: ReturnType<typeof createCellsSlice>;
    let setState: jest.Mock;
    let getState: jest.Mock;

    beforeEach(() => {
        setState = jest.fn((fn) => {
            const newState = typeof fn === 'function' ? fn(getState()) : fn;
            Object.assign(getState(), newState);
            return newState;
        });

        getState = jest.fn(() => ({
            cells: {},
            rootCellIds: ['root-center', 'root-close', 'root-tree'],
            groups: {},
            activeGroupId: null,
            appearance: {},
            hotkeys: {},
            iconCacheIndex: {},
            keyBindings: {},
        }));

        store = createCellsSlice(setState as any, getState as any);
    });

    describe('addCell', () => {
        it('adds a new cell to root', () => {
            const newCell: Cell = {
                id: 'test-cell-1',
                type: 'shortcut',
                cube: { x: 1, y: 0, z: -1 },
                title: 'Test App',
            };

            store.addCell(newCell);

            expect(setState).toHaveBeenCalled();
        });
    });

    describe('removeCell', () => {
        it('removes a cell from root', () => {
            getState.mockReturnValue({
                ...getState(),
                cells: {
                    'test-cell-1': {
                        id: 'test-cell-1',
                        type: 'shortcut',
                        cube: { x: 0, y: 0, z: 0 },
                        title: 'Test',
                    },
                },
                rootCellIds: ['root-center', 'test-cell-1'],
            });

            store.removeCell('test-cell-1');

            expect(setState).toHaveBeenCalled();
        });
    });

    describe('updateCell', () => {
        it('updates cell properties', () => {
            getState.mockReturnValue({
                ...getState(),
                cells: {
                    'test-cell-1': {
                        id: 'test-cell-1',
                        type: 'shortcut',
                        cube: { x: 0, y: 0, z: 0 },
                        title: 'Old Title',
                    },
                },
            });

            store.updateCell('test-cell-1', { title: 'New Title' });

            expect(setState).toHaveBeenCalled();
        });
    });
});
