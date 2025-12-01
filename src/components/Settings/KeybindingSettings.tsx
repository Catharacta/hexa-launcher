import React, { useState, useEffect } from 'react';
import { useLauncherStore } from '../../store/launcherStore';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export const KeybindingSettings: React.FC = () => {
    const { t } = useTranslation();
    const { keyBindings, setKeyBindings } = useLauncherStore();
    const [recordingTarget, setRecordingTarget] = useState<string | null>(null);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!recordingTarget) return;

        e.preventDefault();
        e.stopPropagation();

        // Don't record modifier keys alone
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

        const key = e.key.toUpperCase();

        // For global toggle, we might want modifiers. For hex nav, usually single keys.
        // But let's allow single keys for now as per current simple implementation.
        // If we want to support modifiers, we need to build the string like "Alt+Space".

        let newKey = key;

        if (recordingTarget === 'globalToggle') {
            const modifiers = [];
            if (e.ctrlKey) modifiers.push('Ctrl');
            if (e.altKey) modifiers.push('Alt');
            if (e.shiftKey) modifiers.push('Shift');
            if (e.metaKey) modifiers.push('Super');

            if (modifiers.length > 0) {
                newKey = `${modifiers.join('+')}+${key}`;
            }
        }

        if (recordingTarget === 'globalToggle') {
            setKeyBindings({ globalToggle: newKey });
        } else if (recordingTarget.startsWith('hexNav.')) {
            const direction = recordingTarget.split('.')[1];
            setKeyBindings({
                hexNav: {
                    ...keyBindings.hexNav,
                    [direction]: newKey
                }
            });
        } else if (recordingTarget.startsWith('actions.')) {
            const action = recordingTarget.split('.')[1];
            setKeyBindings({
                actions: {
                    ...keyBindings.actions,
                    [action]: newKey
                }
            });
        }

        setRecordingTarget(null);
    };

    useEffect(() => {
        if (recordingTarget) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [recordingTarget, keyBindings]);

    const renderKeyInput = (label: string, value: string, target: string) => (
        <div className="flex flex-col items-start gap-2 bg-gray-700 p-3 rounded-lg w-full">
            <span className="text-gray-300 text-sm font-medium">{label}</span>
            <button
                onClick={() => setRecordingTarget(target)}
                className={clsx(
                    "w-full px-4 py-2 rounded font-mono text-sm text-left transition-colors overflow-x-auto whitespace-nowrap",
                    recordingTarget === target
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-gray-800 text-cyan-400 hover:bg-gray-600"
                )}
            >
                {recordingTarget === target ? t('keybinding.pressKey') : value}
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Global Hotkey */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">{t('keybinding.globalShortcut')}</h3>
                {renderKeyInput(t('keybinding.toggleLauncher'), keyBindings.globalToggle, "globalToggle")}
                <p className="text-xs text-gray-400 mt-2">
                    {t('keybinding.toggleLauncherDesc')}
                </p>
            </div>

            {/* Hex Navigation */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">{t('keybinding.hexNav')}</h3>
                <div className="grid grid-cols-2 gap-4">
                    {renderKeyInput(t('keybinding.nav.topLeft'), keyBindings.hexNav.northWest, "hexNav.northWest")}
                    {renderKeyInput(t('keybinding.nav.topRight'), keyBindings.hexNav.northEast, "hexNav.northEast")}
                    {renderKeyInput(t('keybinding.nav.left'), keyBindings.hexNav.west, "hexNav.west")}
                    {renderKeyInput(t('keybinding.nav.right'), keyBindings.hexNav.east, "hexNav.east")}
                    {renderKeyInput(t('keybinding.nav.bottomLeft'), keyBindings.hexNav.southWest, "hexNav.southWest")}
                    {renderKeyInput(t('keybinding.nav.bottomRight'), keyBindings.hexNav.southEast, "hexNav.southEast")}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    {t('keybinding.hexNavDesc')}
                </p>
            </div>

            {/* Edit Actions */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">{t('keybinding.editActions')}</h3>
                <div className="grid grid-cols-2 gap-4">
                    {renderKeyInput(t('keybinding.action.createShortcutFile'), keyBindings.actions?.createShortcutFile || '', "actions.createShortcutFile")}
                    {renderKeyInput(t('keybinding.action.createShortcutFolder'), keyBindings.actions?.createShortcutFolder || '', "actions.createShortcutFolder")}
                    {renderKeyInput(t('keybinding.action.createGroup'), keyBindings.actions?.createGroup || '', "actions.createGroup")}
                    {renderKeyInput(t('keybinding.action.renameCell'), keyBindings.actions?.renameCell || '', "actions.renameCell")}
                    {renderKeyInput(t('keybinding.action.deleteCell'), keyBindings.actions?.deleteCell || '', "actions.deleteCell")}
                </div>
            </div>

            {/* Structure Actions */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">{t('keybinding.structureActions')}</h3>
                <div className="flex flex-col items-start gap-2 bg-gray-700 p-3 rounded-lg w-full">
                    <span className="text-gray-300 text-sm font-medium">{t('keybinding.directionalCreateModifier')}</span>
                    <select
                        value={keyBindings.directionalCreateModifier}
                        onChange={(e) => setKeyBindings({ directionalCreateModifier: e.target.value })}
                        className="w-full px-4 py-2 rounded font-mono text-sm bg-gray-800 text-cyan-400 hover:bg-gray-600 border-none outline-none cursor-pointer"
                    >
                        <option value="Shift">Shift</option>
                        <option value="Ctrl">Ctrl</option>
                        <option value="Alt">Alt</option>
                    </select>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    {t('keybinding.directionalCreateModifierDesc')}
                </p>
            </div>

            {/* Reset Button */}
            <div className="pt-4 border-t border-gray-700">
                <button
                    onClick={() => setKeyBindings({
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
                    })}
                    className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                >
                    {t('common.resetToDefaults')}
                </button>
            </div>
        </div>
    );
};
