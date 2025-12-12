import React, { useEffect, useRef } from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { openDialog, getFileIcon } from '../utils/tauri';
import { useTranslation } from 'react-i18next';

interface ContextMenuProps {
    x: number;
    y: number;
    cellId: string;
    onClose: () => void;
}

/**
 * 六角形セル上の右クリックで表示されるコンテキストメニュー。
 * セルの編集、削除、グループ操作、ウィジェット作成などのアクションを提供します。
 * 画面端での表示位置調整（スマートポジショニング）機能を含みます。
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, cellId, onClose }) => {
    const { t } = useTranslation();
    const menuRef = useRef<HTMLDivElement>(null);
    const cell = useLauncherStore(state => state.cells[cellId]);
    const removeCell = useLauncherStore(state => state.removeCell);
    const deleteGroup = useLauncherStore(state => state.deleteGroup);
    const renameGroup = useLauncherStore(state => state.renameGroup);
    const createGroupFolder = useLauncherStore(state => state.createGroupFolder);
    const updateCell = useLauncherStore(state => state.updateCell);
    const appearance = useLauncherStore(state => state.appearance);

    const activeGroupId = useLauncherStore(state => state.activeGroupId);
    const [showSpecialSubmenu, setShowSpecialSubmenu] = React.useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Smart Positioning Logic
    const [style, setStyle] = React.useState<React.CSSProperties>({ top: y, left: x, visibility: 'hidden' });

    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let newX = x;
            let newY = y;

            // Horizontal adjustment
            if (x + rect.width > window.innerWidth) {
                newX = x - rect.width;
            }
            // Vertical adjustment
            if (y + rect.height > window.innerHeight) {
                newY = y - rect.height;
            }

            setStyle({ top: newY, left: newX, visibility: 'visible' });
        }
    }, [x, y]);

    if (!cell) return null;
    if (cell.type === 'launcher_setting') return null;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Delete clicked for', cellId);
        if (cell.type === 'group' && cell.groupId) {
            deleteGroup(cell.groupId);
        } else {
            removeCell(cellId);
        }
        onClose();
    };

    const handleRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Rename clicked for', cellId);
        if (cell.type === 'group' && cell.groupId) {
            const newName = prompt('Enter new group name:', cell.title);
            if (newName) {
                renameGroup(cell.groupId, newName);
            }
        }
        onClose();
    };

    const handleCreateGroup = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Create Group clicked for', cellId);
        const name = prompt('Enter group name:', 'New Group');
        if (name) {
            createGroupFolder(name, cellId);
        }
        onClose();
    };

    const handleEditShortcut = async (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Edit Shortcut clicked for', cellId);
        try {
            const selected = await openDialog({
                multiple: false,
                // filters: undefined // Allow all files
            });

            if (selected && typeof selected === 'string') {
                const title = selected.split(/[\\\/]/).pop()?.replace(/\.(exe|lnk|url)$/i, '') || 'App';
                const icon = await getFileIcon(selected);
                updateCell(cellId, {
                    type: 'shortcut',
                    title: title,
                    icon: icon || undefined,
                    shortcut: {
                        kind: 'file',
                        targetPath: selected,
                    },
                    target: selected // For compatibility
                });
            }
        } catch (err) {
            console.error('Failed to open file dialog', err);
        }
        onClose();
    };

    const handleEditShortcutFolder = async (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Edit Shortcut (Folder) clicked for', cellId);
        try {
            const selected = await openDialog({
                directory: true,
                multiple: false,
            });

            if (selected && typeof selected === 'string') {
                const title = selected.split(/[\\\/]/).pop() || 'Folder';
                const icon = await getFileIcon(selected);
                updateCell(cellId, {
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
        onClose();
    };

    const handleCreateSpecialCell = (type: 'group_tree' | 'group_close' | 'group_back') => {
        let title = '';
        switch (type) {
            case 'group_tree': title = 'Tree'; break;
            case 'group_close': title = 'Close'; break;
            case 'group_back': title = 'Back'; break;
        }

        updateCell(cellId, {
            type: type,
            title: title,
            icon: undefined,
            shortcut: undefined,
            target: undefined,
            groupId: undefined
        });
        onClose();
    };


    const handleCreateWidget = (type: 'clock' | 'system') => {
        updateCell(cellId, {
            type: 'widget',
            title: type === 'clock' ? 'Clock' : 'System',
            widget: { type },
            icon: undefined,
            shortcut: undefined,
            target: undefined,
            groupId: undefined
        });
        onClose();
    };

    const isCyberpunk = appearance.style === 'cyberpunk';
    const itemClass = `block w-full text-left px-4 py-2 text-sm ${isCyberpunk ? 'hover:bg-[#00f2ea]/20' : 'hover:bg-gray-700'}`;
    const deleteClass = `block w-full text-left px-4 py-2 text-sm ${isCyberpunk ? 'hover:bg-[#00f2ea]/20 text-red-400' : 'hover:bg-gray-700 text-red-400'}`;

    return (
        <div
            ref={menuRef}
            className={`fixed z-50 min-w-[180px] rounded shadow-lg border backdrop-blur-md ${isCyberpunk
                ? 'bg-black/80 border-[#00f2ea] text-[#00f2ea] shadow-[0_0_10px_#00f2ea]'
                : 'bg-gray-800/90 border-gray-700 text-white'
                }`}
            style={style}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="py-1">
                {showSpecialSubmenu ? (
                    <>
                        <button onClick={() => setShowSpecialSubmenu(false)} className={itemClass}>
                            {t('contextMenu.back')}
                        </button>
                        <div className={`border-t ${isCyberpunk ? 'border-[#00f2ea]/30' : 'border-gray-600'} my-1`}></div>
                        <button onClick={() => handleCreateSpecialCell('group_tree')} className={itemClass}>
                            {t('contextMenu.tree')}
                        </button>
                        <button onClick={() => handleCreateSpecialCell('group_close')} className={itemClass}>
                            {t('contextMenu.close')}
                        </button>
                        {activeGroupId && (
                            <button onClick={() => handleCreateSpecialCell('group_back')} className={itemClass}>
                                Back
                            </button>
                        )}
                        <div className={`border-t ${isCyberpunk ? 'border-[#00f2ea]/30' : 'border-gray-600'} my-1`}></div>
                        <button onClick={() => handleCreateWidget('clock')} className={itemClass}>
                            {t('contextMenu.clockWidget')}
                        </button>
                        <button onClick={() => handleCreateWidget('system')} className={itemClass}>
                            {t('contextMenu.systemWidget')}
                        </button>
                    </>
                ) : (
                    <>
                        {cell.type === 'group' && (
                            <>
                                <button onClick={handleRename} className={itemClass}>
                                    {t('contextMenu.renameGroup')}
                                </button>
                                <button onClick={handleDelete} className={deleteClass}>
                                    {t('contextMenu.deleteGroup')}
                                </button>
                            </>
                        )}

                        {cell.type !== 'group' && (
                            <>
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    useLauncherStore.getState().setCellEditDialogOpen(true, cellId);
                                    onClose();
                                }} className={itemClass}>
                                    {t('contextMenu.editDetails')}
                                </button>

                                <div className={`border-t ${isCyberpunk ? 'border-[#00f2ea]/30' : 'border-gray-600'} my-1`}></div>

                                <button onClick={handleEditShortcut} className={itemClass}>
                                    {t('contextMenu.editShortcutFile')}
                                </button>

                                <button onClick={handleEditShortcutFolder} className={itemClass}>
                                    {t('contextMenu.editShortcutFolder')}
                                </button>

                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    useLauncherStore.getState().setUwpSelectorOpen(true, cellId);
                                    onClose();
                                }} className={itemClass}>
                                    Select UWP App
                                </button>

                                <div className={`border-t ${isCyberpunk ? 'border-[#00f2ea]/30' : 'border-gray-600'} my-1`}></div>

                                <button onClick={handleCreateGroup} className={itemClass}>
                                    {t('contextMenu.createGroup')}
                                </button>

                                <button onClick={() => setShowSpecialSubmenu(true)} className={itemClass}>
                                    {t('contextMenu.createSpecialCell')}
                                </button>

                                <button onClick={handleDelete} className={deleteClass}>
                                    {t('contextMenu.delete')}
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
