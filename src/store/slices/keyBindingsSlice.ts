import { KeyBindings } from '../../types/models';
import { updateGlobalShortcut } from '../../utils/tauri';

export interface KeyBindingsSlice {
    keyBindings: KeyBindings;
    setKeyBindings: (bindings: Partial<KeyBindings>) => void;
}

export const createKeyBindingsSlice = (set: any, _get: any): KeyBindingsSlice => ({
    keyBindings: {
        globalToggle: 'Alt+Space',
        hexNav: {
            northEast: 'W',
            east: 'S',
            southEast: 'X',
            southWest: 'Z',
            west: 'A',
            northWest: 'Q',
        },
        actions: {
            createShortcutFile: 'Ctrl+N',
            createShortcutFolder: 'Ctrl+Shift+N',
            createGroup: 'Ctrl+G',
            renameCell: 'F2',
            deleteCell: 'Delete',
        },
        directionalCreateModifier: 'Shift',
        search: 'Ctrl+F',
    },
    setKeyBindings: (bindings) => {
        set((state: any) => {
            const newState = {
                keyBindings: {
                    ...state.keyBindings,
                    ...bindings,
                    hexNav: bindings.hexNav
                        ? { ...state.keyBindings.hexNav, ...bindings.hexNav }
                        : state.keyBindings.hexNav,
                },
            };

            // Update global shortcut if changed
            if (bindings.globalToggle && bindings.globalToggle !== state.keyBindings.globalToggle) {
                updateGlobalShortcut(bindings.globalToggle);
            }

            return newState;
        });
    },
});
