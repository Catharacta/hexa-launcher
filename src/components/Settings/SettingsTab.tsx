import React from 'react';
import { useLauncherStore } from '../../store/launcherStore';
import { clsx } from 'clsx';
import { THEMES } from '../../utils/theme';

export interface SettingsTabProps {
    isActive: boolean;
}

export const GeneralTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    if (!isActive) return null;
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-white">General Settings</h2>
            <p className="text-gray-300">Application behavior settings will go here.</p>
        </div>
    );
};

export const AppearanceTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const appearance = useLauncherStore(state => state.appearance);
    const setAppearance = useLauncherStore(state => state.setAppearance);

    if (!isActive) return null;

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold mb-4 text-white">Appearance</h2>

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

import { KeybindingSettings } from './KeybindingSettings';

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
    if (!isActive) return null;
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Cell & Group Manager</h2>
            <p className="text-gray-300">Manage cells and groups here.</p>
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
