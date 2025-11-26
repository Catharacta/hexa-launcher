import React, { useEffect, useRef } from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { openDialog, getFileIcon } from '../utils/tauri';

interface ContextMenuProps {
    x: number;
    y: number;
    cellId: string;
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, cellId, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const cell = useLauncherStore(state => state.cells[cellId]);
    const removeCell = useLauncherStore(state => state.removeCell);
    const deleteGroup = useLauncherStore(state => state.deleteGroup);
    const renameGroup = useLauncherStore(state => state.renameGroup);
    const createGroupFolder = useLauncherStore(state => state.createGroupFolder);
    const updateCell = useLauncherStore(state => state.updateCell);
    const appearance = useLauncherStore(state => state.appearance);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    if (!cell) return null;
    // Disable context menu for system cells
    if (['launcher_setting', 'group_back', 'group_close', 'group_tree'].includes(cell.type)) return null;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Delete clicked for', cellId);
        if (cell.type === 'group' && cell.groupId) {
            if (confirm('Are you sure you want to delete this group and all its contents?')) {
                deleteGroup(cell.groupId);
            }
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
                filters: [{
                    name: 'Applications',
                    extensions: ['exe', 'lnk', 'url']
                }]
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

    const isCyberpunk = appearance.style === 'cyberpunk';

    return (
        <div
            ref={menuRef}
            className={`fixed z-50 min-w-[160px] rounded shadow-lg border backdrop-blur-md ${isCyberpunk
                ? 'bg-black/80 border-[#00f2ea] text-[#00f2ea] shadow-[0_0_10px_#00f2ea]'
                : 'bg-gray-800/90 border-gray-700 text-white'
                }`}
            style={{ top: y, left: x }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
            <div className="py-1">
                {cell.type === 'group' && (
                    <>
                        <button
                            onClick={handleRename}
                            className={`block w-full text-left px-4 py-2 text-sm ${isCyberpunk ? 'hover:bg-[#00f2ea]/20' : 'hover:bg-gray-700'
                                }`}
                        >
                            Rename Group
                        </button>
                        <button
                            onClick={handleDelete}
                            className={`block w-full text-left px-4 py-2 text-sm ${isCyberpunk ? 'hover:bg-[#00f2ea]/20 text-red-400' : 'hover:bg-gray-700 text-red-400'
                                }`}
                        >
                            Delete Group
                        </button>
                    </>
                )}

                {cell.type !== 'group' && (
                    <>
                        <button
                            onClick={handleEditShortcut}
                            className={`block w-full text-left px-4 py-2 text-sm ${isCyberpunk ? 'hover:bg-[#00f2ea]/20' : 'hover:bg-gray-700'
                                }`}
                        >
                            Edit Shortcut (File)
                        </button>

                        <button
                            onClick={handleEditShortcutFolder}
                            className={`block w-full text-left px-4 py-2 text-sm ${isCyberpunk ? 'hover:bg-[#00f2ea]/20' : 'hover:bg-gray-700'
                                }`}
                        >
                            Edit Shortcut (Folder)
                        </button>

                        <button
                            onClick={handleCreateGroup}
                            className={`block w-full text-left px-4 py-2 text-sm ${isCyberpunk ? 'hover:bg-[#00f2ea]/20' : 'hover:bg-gray-700'
                                }`}
                        >
                            Create Group Here
                        </button>

                        <button
                            onClick={handleDelete}
                            className={`block w-full text-left px-4 py-2 text-sm ${isCyberpunk ? 'hover:bg-[#00f2ea]/20 text-red-400' : 'hover:bg-gray-700 text-red-400'
                                }`}
                        >
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
