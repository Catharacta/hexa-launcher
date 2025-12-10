import { useEffect } from 'react';
import { useLauncherStore } from '../../../store/launcherStore';
import { cubeAdd, cubeKey } from '../../../utils/hexUtils';
import { Cell } from '../../../types/models';

/**
 * グローバルおよびグリッド固有のキーボードショートカットを管理するカスタムフック。
 *
 * 以下の機能を提供します：
 * - セル削除 (Delete)
 * - グループ作成 (Ctrl+G)
 * - セル名変更 (F2 / Ctrl+R)
 * - 検索バー起動 (Ctrl+F)
 * - ショートカットファイル作成 (Ctrl+N)
 * - ショートカットフォルダ作成 (Ctrl+Shift+N)
 * - 六角形グリッド上のカーソル移動 (WASD / QEZX)
 * - 方向指定による新規セル作成 (Shift + 移動キー)
 */
export const useKeyboardShortcuts = () => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is focused
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            const state = useLauncherStore.getState();
            const {
                selectedCellIds,
                removeCell: removeCellFn,
                deleteGroup: deleteGroupFn,
                createGroupFolder: createGroupFn,
                updateCell: updateCellFn,
                addCell,
                selectCell,
                clearSelection,
                cells: cellsState,
                keyBindings: kb,
                setSearchActive
            } = state;

            // Helper function to parse shortcut string
            const parseShortcut = (shortcut: string) => {
                const parts = shortcut.split('+');
                const key = parts[parts.length - 1].toLowerCase();
                const needsCtrl = parts.some(p => p.toLowerCase() === 'ctrl');
                const needsShift = parts.some(p => p.toLowerCase() === 'shift');
                const needsAlt = parts.some(p => p.toLowerCase() === 'alt');
                return { key, needsCtrl, needsShift, needsAlt };
            };

            // Helper function to check if shortcut matches
            const matchesShortcut = (e: KeyboardEvent, shortcut: string) => {
                const { key, needsCtrl, needsShift, needsAlt } = parseShortcut(shortcut);
                return e.key.toLowerCase() === key &&
                    e.ctrlKey === needsCtrl &&
                    e.shiftKey === needsShift &&
                    e.altKey === needsAlt;
            };

            // Delete Cell - unified with context menu logic
            if (matchesShortcut(e, kb.actions.deleteCell)) {
                if (selectedCellIds.length > 0) {
                    selectedCellIds.forEach(id => {
                        const cell = cellsState[id];
                        if (cell) {
                            if (cell.type === 'group' && cell.groupId) {
                                deleteGroupFn(cell.groupId);
                            } else {
                                removeCellFn(id);
                            }
                        }
                    });
                    clearSelection();
                }
                return;
            }

            // Create Group - unified with context menu logic (prompts for name)
            if (matchesShortcut(e, kb.actions.createGroup)) {
                console.log('Ctrl+G pressed - Create Group');
                e.preventDefault();
                if (selectedCellIds.length > 0) {
                    const firstCellId = selectedCellIds[0];
                    console.log('Showing prompt for group name');
                    const name = prompt('Enter group name:', 'New Group');
                    console.log('User entered name:', name);
                    if (name) {
                        createGroupFn(name, firstCellId);
                    }
                }
                return;
            }

            // Rename Cell - unified with context menu logic
            if (matchesShortcut(e, kb.actions.renameCell)) {
                e.preventDefault();
                if (selectedCellIds.length === 1) {
                    const cellId = selectedCellIds[0];
                    const cell = cellsState[cellId];
                    if (cell && cell.type !== 'launcher_setting') {
                        const newName = prompt('Enter new name:', cell.title);
                        if (newName && newName.trim()) {
                            if (cell.type === 'group' && cell.groupId) {
                                useLauncherStore.getState().renameGroup(cell.groupId, newName.trim());
                            } else {
                                updateCellFn(cellId, { title: newName.trim() });
                            }
                        }
                    }
                }
                return;
            }

            // Search (Ctrl+F)
            if (matchesShortcut(e, kb.search)) {
                e.preventDefault();
                setSearchActive(true);
                return;
            }

            // Create Shortcut File (Ctrl+N) - using dialog
            if (matchesShortcut(e, kb.actions.createShortcutFile)) {
                console.log('Ctrl+N pressed - Create Shortcut File');
                e.preventDefault();
                if (selectedCellIds.length === 1) {
                    const cellId = selectedCellIds[0];
                    const cell = cellsState[cellId];
                    if (cell && cell.type !== 'launcher_setting') {
                        // Import and call openDialog
                        import('../../../utils/tauri').then(async ({ openDialog, getFileIcon }) => {
                            try {
                                const selected = await openDialog({
                                    multiple: false,
                                    filters: [{
                                        name: 'Applications',
                                        extensions: ['exe', 'lnk', 'url']
                                    }]
                                });

                                if (selected && typeof selected === 'string') {
                                    const title = selected.split(/[\\\/]/).pop()?.replace(/\.(exe|lnk|url)$/i, '') || 'App';
                                    const icon = await getFileIcon(selected);
                                    updateCellFn(cellId, {
                                        type: 'shortcut',
                                        title: title,
                                        icon: icon || undefined,
                                        shortcut: {
                                            kind: 'file',
                                            targetPath: selected,
                                        },
                                        target: selected
                                    });
                                }
                            } catch (err) {
                                console.error('Failed to open file dialog', err);
                            }
                        });
                    }
                }
                return;
            }

            // Create Shortcut Folder (Ctrl+Shift+N) - using dialog
            if (matchesShortcut(e, kb.actions.createShortcutFolder)) {
                console.log('Ctrl+Shift+N pressed - Create Shortcut Folder');
                e.preventDefault();
                if (selectedCellIds.length === 1) {
                    const cellId = selectedCellIds[0];
                    const cell = cellsState[cellId];
                    if (cell && cell.type !== 'launcher_setting') {
                        // Import and call openDialog
                        import('../../../utils/tauri').then(async ({ openDialog, getFileIcon }) => {
                            try {
                                const selected = await openDialog({
                                    directory: true,
                                    multiple: false,
                                });

                                if (selected && typeof selected === 'string') {
                                    const title = selected.split(/[\\\/]/).pop() || 'Folder';
                                    const icon = await getFileIcon(selected);
                                    updateCellFn(cellId, {
                                        type: 'shortcut',
                                        title: title,
                                        icon: icon || undefined,
                                        shortcut: {
                                            kind: 'file',
                                            targetPath: selected,
                                        },
                                        target: selected
                                    });
                                }
                            } catch (err) {
                                console.error('Failed to open folder dialog', err);
                            }
                        });
                    }
                }
                return;
            }

            // Hex Navigation (with optional Shift for directional create)
            if (selectedCellIds.length === 1) {
                const currentCell = cellsState[selectedCellIds[0]];
                if (!currentCell) return;

                // Create hex navigation mapping from keyBindings
                const hexNavMap: Record<string, { x: number, y: number, z: number }> = {
                    [kb.hexNav.northWest.toLowerCase()]: { x: 0, y: 1, z: -1 },   // Q - NW
                    [kb.hexNav.northEast.toLowerCase()]: { x: 1, y: 0, z: -1 },   // W - NE
                    [kb.hexNav.west.toLowerCase()]: { x: -1, y: 1, z: 0 },        // A - W
                    [kb.hexNav.east.toLowerCase()]: { x: 1, y: -1, z: 0 },        // S - E
                    [kb.hexNav.southWest.toLowerCase()]: { x: -1, y: 0, z: 1 },   // Z - SW
                    [kb.hexNav.southEast.toLowerCase()]: { x: 0, y: -1, z: 1 },   // X - SE
                };

                const direction = hexNavMap[e.key.toLowerCase()];

                if (direction) {
                    e.preventDefault();
                    const targetCube = cubeAdd(currentCell.cube, direction);
                    const targetKey = cubeKey(targetCube);

                    // Check if Shift is pressed for directional create
                    if (e.shiftKey && kb.directionalCreateModifier === 'Shift') {
                        // Create new cell in the direction
                        const isOccupied = Object.values(cellsState).some(c => cubeKey(c.cube) === targetKey);
                        if (!isOccupied) {
                            const newCell: Cell = {
                                id: `cell-${Date.now()}`,
                                type: 'app',
                                cube: targetCube,
                                title: 'New App',
                                icon: 'https://vitejs.dev/logo.svg',
                            };
                            addCell(newCell);
                            selectCell(newCell.id, false);
                        }
                    } else {
                        // Navigate to existing cell
                        const targetCell = Object.values(cellsState).find(c => cubeKey(c.cube) === targetKey);
                        if (targetCell) {
                            selectCell(targetCell.id, false);
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};
