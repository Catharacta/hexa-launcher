import { create } from 'zustand';
import { createCellsSlice, CellsSlice } from './slices/cellsSlice';
import { createGroupsSlice, GroupsSlice } from './slices/groupsSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import { createAppearanceSlice, AppearanceSlice } from './slices/appearanceSlice';
import { createKeyBindingsSlice, KeyBindingsSlice } from './slices/keyBindingsSlice';
import { createSelectionSlice, SelectionSlice } from './slices/selectionSlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';
import { createSearchSlice, SearchSlice } from './slices/searchSlice';

export type LauncherState = CellsSlice &
    GroupsSlice &
    SettingsSlice &
    AppearanceSlice &
    KeyBindingsSlice &
    SelectionSlice &
    UiSlice &
    SearchSlice;

export const useLauncherStore = create<LauncherState>((set, get) => ({
    ...createCellsSlice(set, get),
    ...createGroupsSlice(set, get),
    ...createSettingsSlice(set, get),
    ...createAppearanceSlice(set, get),
    ...createKeyBindingsSlice(set, get),
    ...createSelectionSlice(set, get),
    ...createUiSlice(set, get),
    ...createSearchSlice(set, get),
}));