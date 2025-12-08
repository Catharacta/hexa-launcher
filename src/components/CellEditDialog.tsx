import React, { useState, useEffect } from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { useTranslation } from 'react-i18next';
import { convertFileSrc } from '@tauri-apps/api/core';

export const CellEditDialog: React.FC = () => {
    const { t } = useTranslation();
    const cellEditDialogOpen = useLauncherStore(state => state.cellEditDialogOpen);
    const editingCellId = useLauncherStore(state => state.editingCellId);
    const setCellEditDialogOpen = useLauncherStore(state => state.setCellEditDialogOpen);
    const cells = useLauncherStore(state => state.cells);
    const updateCell = useLauncherStore(state => state.updateCell);
    const addToast = useLauncherStore(state => state.addToast);

    const [name, setName] = useState('');
    const [arguments_, setArguments] = useState('');
    const [workingDirectory, setWorkingDirectory] = useState('');
    const [customIcon, setCustomIcon] = useState<string | null>(null);

    const cell = editingCellId ? cells[editingCellId] : null;

    useEffect(() => {
        if (cell) {
            setName(cell.title || '');
            setArguments(cell.shortcut?.arguments || cell.args || '');
            setWorkingDirectory(cell.shortcut?.workingDirectory || cell.workingDir || '');
            setCustomIcon(cell.customIcon || null);
        }
    }, [cell]);

    if (!cellEditDialogOpen || !cell) return null;

    const handleSave = () => {
        if (!name.trim()) {
            addToast(t('cellEditDialog.nameRequired'), 'error');
            return;
        }

        // Update cell with new values
        if (cell.type === 'shortcut' && cell.shortcut) {
            updateCell(cell.id, {
                title: name,
                shortcut: {
                    ...cell.shortcut,
                    arguments: arguments_.trim() || undefined,
                    workingDirectory: workingDirectory.trim() || undefined,
                },
                customIcon: customIcon || undefined,
            });
        } else {
            // Legacy format
            updateCell(cell.id, {
                title: name,
                args: arguments_.trim() || undefined,
                workingDir: workingDirectory.trim() || undefined,
                customIcon: customIcon || undefined,
            });
        }

        addToast(t('cellEditDialog.updateSuccess'), 'success');
        setCellEditDialogOpen(false);
    };

    const handleCancel = () => {
        setCellEditDialogOpen(false);
    };

    const handleBrowseWorkingDir = async () => {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({
                directory: true,
                multiple: false,
            });
            if (selected) {
                setWorkingDirectory(selected as string);
            }
        } catch (error) {
            console.error('Failed to open directory dialog:', error);
            addToast(t('toast.error.failedToOpenDirectoryBrowser'), 'error');
        }
    };

    const handleBrowseIcon = async () => {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Image',
                    extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp', 'ico']
                }]
            });
            if (selected) {
                setCustomIcon(selected as string);
            }
        } catch (error) {
            console.error('Failed to open file dialog:', error);
            addToast(t('toast.error.failedToOpenFileDialog', 'Failed to open file dialog'), 'error');
        }
    };

    const handleRemoveIcon = () => {
        setCustomIcon(null);
    };

    const targetPath = cell.shortcut?.targetPath || cell.target || '';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-[500px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">{t('cellEditDialog.title')}</h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            {t('cellEditDialog.name')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                            placeholder="App Name"
                        />
                    </div>

                    {/* Target Path (Read-only) */}
                    {targetPath && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                {t('cellEditDialog.targetPath')}
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-900 text-gray-400 rounded border border-gray-700 text-sm break-all">
                                {targetPath}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{t('cellEditDialog.readOnly')}</p>
                        </div>
                    )}

                    {/* Custom Icon */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            {t('cellEditDialog.icon', 'Icon')}
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border border-gray-600 shrink-0">
                                {customIcon ? (
                                    <img
                                        src={convertFileSrc(customIcon)}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                ) : cell.icon ? (
                                    <img
                                        src={cell.icon}
                                        alt="Current"
                                        className="w-full h-full object-contain opacity-50"
                                    />
                                ) : (
                                    <span className="text-gray-500 text-xs text-center px-1">No Icon</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleBrowseIcon}
                                    className="px-3 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 hover:bg-gray-600 transition-colors"
                                >
                                    {t('cellEditDialog.changeIcon', 'Change Icon')}
                                </button>
                                {customIcon && (
                                    <button
                                        onClick={handleRemoveIcon}
                                        className="px-3 py-1 bg-red-900/50 text-red-200 text-sm rounded border border-red-900 hover:bg-red-900 transition-colors"
                                    >
                                        {t('cellEditDialog.resetIcon', 'Reset Icon')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Arguments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            {t('cellEditDialog.arguments')}
                        </label>
                        <input
                            type="text"
                            value={arguments_}
                            onChange={(e) => setArguments(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                            placeholder="--fullscreen --debug"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {t('cellEditDialog.argumentsExample')}
                        </p>
                    </div>

                    {/* Working Directory */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            {t('cellEditDialog.workingDirectory')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={workingDirectory}
                                onChange={(e) => setWorkingDirectory(e.target.value)}
                                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                                placeholder="C:\Users\Name\Documents"
                            />
                            <button
                                onClick={handleBrowseWorkingDir}
                                className="px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 hover:bg-gray-600 transition-colors"
                            >
                                {t('cellEditDialog.browse')}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('cellEditDialog.workingDirectoryExample')}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                        {t('cellEditDialog.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors"
                    >
                        {t('cellEditDialog.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
