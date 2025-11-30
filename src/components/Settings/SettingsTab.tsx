import React from 'react';
import { useLauncherStore } from '../../store/launcherStore';
import { clsx } from 'clsx';
import { THEMES } from '../../utils/theme';
import { KeybindingSettings } from './KeybindingSettings';

export interface SettingsTabProps {
    isActive: boolean;
}

export const GeneralTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const general = useLauncherStore(state => state.general);
    const setGeneralSettings = useLauncherStore(state => state.setGeneralSettings);
    const resetGeneralSettings = useLauncherStore(state => state.resetGeneralSettings);

    if (!isActive) return null;
    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">General Settings</h2>
                <button
                    onClick={resetGeneralSettings}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                >
                    Reset to Defaults
                </button>
            </div>

            {/* Start on Boot */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-white">Start on Boot</label>
                    <p className="text-xs text-gray-400">Launch Hexa Launcher when Windows starts</p>
                </div>
                <button
                    onClick={() => setGeneralSettings({ startOnBoot: !general.startOnBoot })}
                    className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        general.startOnBoot ? "bg-cyan-600" : "bg-gray-600"
                    )}
                >
                    <div className={clsx(
                        "w-4 h-4 rounded-full bg-white absolute top-1 transition-all",
                        general.startOnBoot ? "left-7" : "left-1"
                    )} />
                </button>
            </div>

            {/* Window Behavior */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Window Behavior</h3>

                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Always on Top</label>
                    <input
                        type="checkbox"
                        checked={general.windowBehavior.alwaysOnTop}
                        onChange={(e) => setGeneralSettings({
                            windowBehavior: { ...general.windowBehavior, alwaysOnTop: e.target.checked }
                        })}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Hide on Blur</label>
                    <input
                        type="checkbox"
                        checked={general.windowBehavior.hideOnBlur}
                        onChange={(e) => setGeneralSettings({
                            windowBehavior: { ...general.windowBehavior, hideOnBlur: e.target.checked }
                        })}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Show on Mouse Edge</label>
                    <input
                        type="checkbox"
                        checked={general.windowBehavior.showOnMouseEdge}
                        onChange={(e) => setGeneralSettings({
                            windowBehavior: { ...general.windowBehavior, showOnMouseEdge: e.target.checked }
                        })}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                </div>
            </div>

            {/* Language */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                <select
                    value={general.language}
                    onChange={(e) => setGeneralSettings({ language: e.target.value as 'en' | 'ja' })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="en">English</option>
                    <option value="ja">日本語 (Japanese)</option>
                </select>
            </div>
        </div>
    );
};

export const AppearanceTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const appearance = useLauncherStore(state => state.appearance);
    const setAppearance = useLauncherStore(state => state.setAppearance);
    const resetAppearance = useLauncherStore(state => state.resetAppearance);

    if (!isActive) return null;

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Appearance</h2>
                <button
                    onClick={resetAppearance}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                >
                    Reset to Defaults
                </button>
            </div>

            {/* Visual Style Setting */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Visual Style
                </label>
                <div className="flex gap-4">
                    <button
                        onClick={() => setAppearance({ style: 'default' })}
                        className={clsx(
                            "px-4 py-2 rounded-lg border transition-all",
                            appearance.style === 'default'
                                ? "bg-gray-700 border-cyan-500 text-white"
                                : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"
                        )}
                    >
                        Default
                    </button>
                    <button
                        onClick={() => setAppearance({ style: 'cyberpunk' })}
                        className={clsx(
                            "px-4 py-2 rounded-lg border transition-all font-mono",
                            appearance.style === 'cyberpunk'
                                ? "bg-black border-[#00f2ea] text-[#00f2ea] shadow-[0_0_10px_rgba(0,242,234,0.3)]"
                                : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"
                        )}
                    >
                        Cyberpunk
                    </button>
                </div>
            </div>

            {/* Opacity Setting */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Background Opacity: {Math.round(appearance.opacity * 100)}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={appearance.opacity}
                    onChange={(e) => setAppearance({ opacity: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>

            {/* Theme Color Setting (Only visible in Default mode) */}
            {appearance.style !== 'cyberpunk' && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Theme Color
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {Object.values(THEMES).map((theme) => (
                            <button
                                key={theme.name}
                                onClick={() => setAppearance({ themeColor: theme.name })}
                                className={clsx(
                                    "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center",
                                    appearance.themeColor === theme.name
                                        ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                        : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: theme.color }}
                                title={theme.label}
                            >
                                {appearance.themeColor === theme.name && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white drop-shadow-md">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const KeybindingTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    if (!isActive) return null;
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Keybindings</h2>
            <KeybindingSettings />
        </div>
    );
};

export const CellManagerTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const grid = useLauncherStore(state => state.grid);
    const setGridSettings = useLauncherStore(state => state.setGridSettings);
    const resetGridSettings = useLauncherStore(state => state.resetGridSettings);

    if (!isActive) return null;
    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Cells & Groups</h2>
                <button
                    onClick={resetGridSettings}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                >
                    Reset to Defaults
                </button>
            </div>

            {/* Hex Size */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hex Size: {grid.hexSize}px
                </label>
                <input
                    type="range"
                    min="40"
                    max="100"
                    step="5"
                    value={grid.hexSize}
                    onChange={(e) => setGridSettings({ hexSize: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>

            {/* Gap Size */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gap Size: {grid.gapSize}px
                </label>
                <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={grid.gapSize}
                    onChange={(e) => setGridSettings({ gapSize: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>

            {/* Animation Speed */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Animation Speed</label>
                <div className="flex gap-2">
                    {(['slow', 'normal', 'fast'] as const).map((speed) => (
                        <button
                            key={speed}
                            onClick={() => setGridSettings({ animationSpeed: speed })}
                            className={clsx(
                                "px-3 py-1 rounded border text-sm capitalize transition-colors",
                                grid.animationSpeed === speed
                                    ? "bg-cyan-600 border-cyan-500 text-white"
                                    : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                            )}
                        >
                            {speed}
                        </button>
                    ))}
                </div>
            </div>

            {/* Show Labels */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Show Labels</label>
                <select
                    value={grid.showLabels}
                    onChange={(e) => setGridSettings({ showLabels: e.target.value as 'always' | 'hover' | 'never' })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="always">Always</option>
                    <option value="hover">On Hover</option>
                    <option value="never">Never</option>
                </select>
            </div>

            {/* Hover Effect */}
            <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Hover Effect</label>
                <input
                    type="checkbox"
                    checked={grid.hoverEffect}
                    onChange={(e) => setGridSettings({ hoverEffect: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
            </div>
        </div>
    );
};

export const PersistenceTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    if (!isActive) return null;
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Persistence</h2>
            <p className="text-gray-300">Backup and restore settings will go here.</p>
        </div>
    );
};

export const SecurityTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    if (!isActive) return null;
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Security</h2>
            <p className="text-gray-300">Security related settings will go here.</p>
        </div>
    );
};

export const AdvancedTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    if (!isActive) return null;
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Advanced</h2>
            <p className="text-gray-300">Advanced configuration options will go here.</p>
        </div>
    );
};

export const HelpTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    if (!isActive) return null;
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Help</h2>
            <p className="text-gray-300">Help and about information will go here.</p>
        </div>
    );
};
