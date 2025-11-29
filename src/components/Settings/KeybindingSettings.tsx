import React, { useState, useEffect } from 'react';
import { useLauncherStore } from '../../store/launcherStore';
import { clsx } from 'clsx';

export const KeybindingSettings: React.FC = () => {
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
                {recordingTarget === target ? "Press Key..." : value}
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Global Hotkey */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Global Shortcut</h3>
                {renderKeyInput("Toggle Launcher", keyBindings.globalToggle, "globalToggle")}
                <p className="text-xs text-gray-400 mt-2">
                    Press the key combination to toggle the launcher visibility.
                </p>
            </div>

            {/* Hex Navigation */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Hexagonal Navigation</h3>
                <div className="grid grid-cols-2 gap-4">
                    {renderKeyInput("Top-Left", keyBindings.hexNav.northWest, "hexNav.northWest")}
                    {renderKeyInput("Top-Right", keyBindings.hexNav.northEast, "hexNav.northEast")}
                    {renderKeyInput("Left", keyBindings.hexNav.west, "hexNav.west")}
                    {renderKeyInput("Right", keyBindings.hexNav.east, "hexNav.east")}
                    {renderKeyInput("Bottom-Left", keyBindings.hexNav.southWest, "hexNav.southWest")}
                    {renderKeyInput("Bottom-Right", keyBindings.hexNav.southEast, "hexNav.southEast")}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Keys used to navigate between hexagonal cells.
                </p>
            </div>

            {/* Edit Actions */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Edit Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                    {renderKeyInput("Create Shortcut (File)", keyBindings.actions?.createShortcutFile || '', "actions.createShortcutFile")}
                    {renderKeyInput("Create Shortcut (Folder)", keyBindings.actions?.createShortcutFolder || '', "actions.createShortcutFolder")}
                    {renderKeyInput("Create Group", keyBindings.actions?.createGroup || '', "actions.createGroup")}
                    {renderKeyInput("Rename Cell", keyBindings.actions?.renameCell || '', "actions.renameCell")}
                    {renderKeyInput("Delete Cell", keyBindings.actions?.deleteCell || '', "actions.deleteCell")}
                </div>
            </div>

            {/* Structure Actions */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Structure Actions</h3>
                <div className="flex flex-col items-start gap-2 bg-gray-700 p-3 rounded-lg w-full">
                    <span className="text-gray-300 text-sm font-medium">Directional Create Modifier</span>
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
                    Hold this modifier + Hex Navigation Key to create a new cell in that direction.
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
                    Reset to Defaults
                </button>
            </div>
        </div>
    );
};
