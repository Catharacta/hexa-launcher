import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../../store/launcherStore';
import { SettingsSection } from '../shared/SettingsSection';

export const KeybindingSettings: React.FC = () => {
    const { t } = useTranslation();
    const { keyBindings, setKeyBindings } = useLauncherStore();
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';
    const [recordingTarget, setRecordingTarget] = useState<string | null>(null);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!recordingTarget) return;

        e.preventDefault();
        e.stopPropagation();

        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

        const key = e.key.toUpperCase();
        let newKey = key;

        if (recordingTarget === 'globalToggle' || recordingTarget === 'search') {
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
        } else if (recordingTarget === 'search') {
            setKeyBindings({ search: newKey });
        } else if (recordingTarget.startsWith('hexNav.')) {
            const direction = recordingTarget.split('.')[1];
            setKeyBindings({
                hexNav: { ...keyBindings.hexNav, [direction]: newKey }
            });
        } else if (recordingTarget.startsWith('actions.')) {
            const action = recordingTarget.split('.')[1];
            setKeyBindings({
                actions: { ...keyBindings.actions, [action]: newKey }
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

    const RenderKeyInput = ({ label, value, target }: { label: string, value: string, target: string }) => (
        <div className="flex flex-col items-start gap-2 w-full">
            <span className={clsx("text-sm font-medium", isCyberpunk ? "text-gray-300" : "text-gray-300")}>{label}</span>
            <button
                onClick={() => setRecordingTarget(target)}
                className={clsx(
                    "w-full px-4 py-2 rounded font-mono text-sm text-left transition-all overflow-x-auto whitespace-nowrap",
                    recordingTarget === target
                        ? "bg-[#ff003c] text-white animate-pulse shadow-[0_0_10px_#ff003c]"
                        : (isCyberpunk
                            ? "bg-black/50 border border-[#00f2ea]/30 text-[#00f2ea] hover:bg-[#00f2ea]/10"
                            : "bg-gray-700 border border-gray-600 text-cyan-400 hover:bg-gray-600")
                )}
            >
                {recordingTarget === target ? t('keybinding.pressKey') : value}
            </button>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsSection
                title={t('settings.keybinding')}
                headerAction={
                    <button
                        onClick={() => setKeyBindings({
                            globalToggle: 'Alt+Space',
                            hexNav: {
                                northEast: 'W', east: 'S', southEast: 'X', southWest: 'Z', west: 'A', northWest: 'Q',
                            },
                            actions: {
                                createShortcutFile: 'Ctrl+N', createShortcutFolder: 'Ctrl+Shift+N',
                                createGroup: 'Ctrl+G', renameCell: 'F2', deleteCell: 'Delete',
                            },
                            directionalCreateModifier: 'Shift',
                            search: 'Ctrl+F',
                        })}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                        {t('common.resetToDefaults')}
                    </button>
                }
            >
                <div>
                    <RenderKeyInput label={t('keybinding.globalShortcut')} value={keyBindings.globalToggle} target="globalToggle" />
                    <p className="text-xs text-gray-500 mt-1">{t('keybinding.toggleLauncherDesc')}</p>
                </div>

                <div>
                    <RenderKeyInput label={t('keybinding.search')} value={keyBindings.search} target="search" />
                </div>
            </SettingsSection>

            <SettingsSection
                title={t('keybinding.hexNav')}
                description={t('keybinding.hexNavDesc')}
            >
                <div className="grid grid-cols-2 gap-4">
                    <RenderKeyInput label={t('keybinding.nav.topRight')} value={keyBindings.hexNav.northEast} target="hexNav.northEast" />
                    <RenderKeyInput label={t('keybinding.nav.right')} value={keyBindings.hexNav.east} target="hexNav.east" />
                    <RenderKeyInput label={t('keybinding.nav.bottomRight')} value={keyBindings.hexNav.southEast} target="hexNav.southEast" />
                    <RenderKeyInput label={t('keybinding.nav.bottomLeft')} value={keyBindings.hexNav.southWest} target="hexNav.southWest" />
                    <RenderKeyInput label={t('keybinding.nav.left')} value={keyBindings.hexNav.west} target="hexNav.west" />
                    <RenderKeyInput label={t('keybinding.nav.topLeft')} value={keyBindings.hexNav.northWest} target="hexNav.northWest" />
                </div>
            </SettingsSection>

            <SettingsSection title={t('keybinding.editActions')}>
                <div className="grid grid-cols-2 gap-4">
                    <RenderKeyInput label={t('keybinding.action.createShortcutFile')} value={keyBindings.actions?.createShortcutFile || ''} target="actions.createShortcutFile" />
                    <RenderKeyInput label={t('keybinding.action.createShortcutFolder')} value={keyBindings.actions?.createShortcutFolder || ''} target="actions.createShortcutFolder" />
                    <RenderKeyInput label={t('keybinding.action.createGroup')} value={keyBindings.actions?.createGroup || ''} target="actions.createGroup" />
                    <RenderKeyInput label={t('keybinding.action.renameCell')} value={keyBindings.actions?.renameCell || ''} target="actions.renameCell" />
                    <RenderKeyInput label={t('keybinding.action.deleteCell')} value={keyBindings.actions?.deleteCell || ''} target="actions.deleteCell" />
                </div>
            </SettingsSection>

            <SettingsSection title={t('keybinding.structureActions')}>
                <div className="flex flex-col items-start gap-2 w-full">
                    <span className={clsx("text-sm font-medium", isCyberpunk ? "text-gray-300" : "text-gray-300")}>{t('keybinding.directionalCreateModifier')}</span>
                    <select
                        value={keyBindings.directionalCreateModifier}
                        onChange={(e) => setKeyBindings({ directionalCreateModifier: e.target.value })}
                        className={clsx(
                            "w-full px-4 py-2 rounded font-mono text-sm border-none outline-none cursor-pointer transition-all",
                            isCyberpunk
                                ? "bg-black/50 border border-[#00f2ea]/30 text-[#00f2ea] hover:bg-[#00f2ea]/10"
                                : "bg-gray-700 text-cyan-400 hover:bg-gray-600"
                        )}
                    >
                        <option value="Shift">Shift</option>
                        <option value="Ctrl">Ctrl</option>
                        <option value="Alt">Alt</option>
                    </select>
                </div>
            </SettingsSection>
        </div>
    );
};
