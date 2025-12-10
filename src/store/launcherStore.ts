import { create } from 'zustand';
import { createCellsSlice, CellsSlice } from './slices/cellsSlice';
import { createGroupsSlice, GroupsSlice } from './slices/groupsSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import { createAppearanceSlice, AppearanceSlice } from './slices/appearanceSlice';
import { createKeyBindingsSlice, KeyBindingsSlice } from './slices/keyBindingsSlice';
import { createSelectionSlice, SelectionSlice } from './slices/selectionSlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';
import { createSearchSlice, SearchSlice } from './slices/searchSlice';

/**
 * アプリケーション全体のステートを管理する型定義。
 * 各機能ごとのスライス（Slice）を統合しています。
 */
export type LauncherState = CellsSlice &
    GroupsSlice &
    SettingsSlice &
    AppearanceSlice &
    KeyBindingsSlice &
    SelectionSlice &
    UiSlice &
    SearchSlice;

/**
 * Zustandを使用したグローバルストア。
 * 
 * 機能ごとに分割されたスライス（Cells, Groups, Settings...）を合成し、
 * 単一のフック `useLauncherStore` として提供します。
 * コンポーネントからは `const { cells, addCell } = useLauncherStore()` のようにして使用します。
 */
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