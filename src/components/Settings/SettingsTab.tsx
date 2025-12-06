import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLauncherStore } from '../../store/launcherStore';
import { clsx } from 'clsx';
import { THEMES } from '../../utils/theme';
import { KeybindingSettings } from './KeybindingSettings';
import {
    getStartupStatus,
    setStartup,
    setAlwaysOnTop,
    exportSettingsJson,
    saveSettingsToFile,
    loadSettingsFromFile,
    saveSettings
} from '../../utils/tauri';
import i18n from '../../i18n/config';

export interface SettingsTabProps {
    isActive: boolean;
}

export const GeneralTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const { t } = useTranslation();
    const general = useLauncherStore(state => state.general);
    const setGeneralSettings = useLauncherStore(state => state.setGeneralSettings);
    const resetGeneralSettings = useLauncherStore(state => state.resetGeneralSettings);
    const [startupEnabled, setStartupEnabled] = useState(false);
    const [isCheckingStartup, setIsCheckingStartup] = useState(false);

    // Load actual startup status on mount
    useEffect(() => {
        if (isActive) {
            setIsCheckingStartup(true);
            // const { getStartupStatus } = require('../../utils/tauri');
            getStartupStatus()
                .then((enabled: boolean) => {
                    setStartupEnabled(enabled);
                    if (enabled !== general.startOnBoot) {
                        setGeneralSettings({ startOnBoot: enabled });
                    }
                })
                .catch(console.error)
                .finally(() => setIsCheckingStartup(false));
        }
    }, [isActive]);

    const handleStartupToggle = async () => {
        try {
            const newValue = !startupEnabled;
            // const { setStartup } = await import('../../utils/tauri');
            await setStartup(newValue);
            setStartupEnabled(newValue);
            setGeneralSettings({ startOnBoot: newValue });
        } catch (error) {
            alert(`Failed to set startup: ${error}`);
        }
    };

    const handleAlwaysOnTopToggle = async (enabled: boolean) => {
        try {
            // const { setAlwaysOnTop } = await import('../../utils/tauri');
            await setAlwaysOnTop(enabled);
            setGeneralSettings({ windowBehavior: { ...general.windowBehavior, alwaysOnTop: enabled } });
        } catch (error) {
            console.error('Failed to set always on top:', error);
            alert(`Failed to set always on top: ${error}`);
        }
    };

    if (!isActive) return null;
    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{t('settings.general')}</h2>
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
                    <label className="block text-sm font-medium text-white">{t('general.startOnBoot')}</label>
                    <p className="text-xs text-gray-400">Launch Hexa Launcher when Windows starts</p>
                </div>
                <button
                    onClick={handleStartupToggle}
                    disabled={isCheckingStartup}
                    className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        isCheckingStartup ? "bg-gray-500 cursor-not-allowed" : (startupEnabled ? "bg-cyan-600" : "bg-gray-600")
                    )}
                >
                    <div className={clsx(
                        "w-4 h-4 rounded-full bg-white absolute top-1 transition-all",
                        startupEnabled ? "left-7" : "left-1"
                    )} />
                </button>
            </div>

            {/* Window Behavior */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">{t('general.windowBehavior')}</h3>

                {/* Always on Top */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-white">{t('general.alwaysOnTop')}</label>
                        <p className="text-xs text-gray-400">Keep launcher above other windows</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={general.windowBehavior.alwaysOnTop}
                        onChange={(e) => handleAlwaysOnTopToggle(e.target.checked)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                </div>

                {/* Hide on Blur */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-white">{t('general.hideOnBlur')}</label>
                        <p className="text-xs text-gray-400">Hide launcher when it loses focus</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={general.windowBehavior.hideOnBlur}
                        onChange={(e) => setGeneralSettings({ windowBehavior: { ...general.windowBehavior, hideOnBlur: e.target.checked } })}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                </div>

                {/* Show on Mouse Edge */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-white">{t('general.showOnMouseEdge')}</label>
                        <p className="text-xs text-gray-400">Show launcher when mouse reaches screen edge</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={general.windowBehavior.showOnMouseEdge}
                        onChange={(e) => setGeneralSettings({ windowBehavior: { ...general.windowBehavior, showOnMouseEdge: e.target.checked } })}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                </div>
            </div>

            {/* Language */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('general.language')}</label>
                <select
                    value={general.language}
                    onChange={(e) => {
                        const newLang = e.target.value as 'en' | 'ja';
                        setGeneralSettings({ language: newLang });
                        i18n.changeLanguage(newLang);
                    }}
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
    const { t } = useTranslation();
    const appearance = useLauncherStore(state => state.appearance);
    const setAppearance = useLauncherStore(state => state.setAppearance);
    const resetAppearance = useLauncherStore(state => state.resetAppearance);

    if (!isActive) return null;

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{t('settings.appearance')}</h2>
                <button
                    onClick={resetAppearance}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                >
                    {t('common.resetToDefaults')}
                </button>
            </div>

            {/* Visual Style Setting */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('appearance.visualStyle')}
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
                        {t('appearance.style.default')}
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
                        {t('appearance.style.cyberpunk')}
                    </button>
                </div>
            </div>

            {/* Opacity Setting */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('appearance.opacity')}: {Math.round(appearance.opacity * 100)}%
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
                        {t('appearance.themeColor')}
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
    const { t } = useTranslation();
    const grid = useLauncherStore(state => state.grid);
    const setGridSettings = useLauncherStore(state => state.setGridSettings);
    const resetGridSettings = useLauncherStore(state => state.resetGridSettings);

    if (!isActive) return null;
    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{t('settings.cellManager')}</h2>
                <button
                    onClick={resetGridSettings}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                >
                    {t('common.resetToDefaults')}
                </button>
            </div>

            {/* Hex Size */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('cellManager.hexSize')}: {grid.hexSize}px
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
                    {t('cellManager.gapSize')}: {grid.gapSize}px
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
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('cellManager.animationSpeed')}</label>
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
                            {t(`cellManager.speed.${speed}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Show Labels */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('cellManager.showLabels')}</label>
                <select
                    value={grid.showLabels}
                    onChange={(e) => setGridSettings({ showLabels: e.target.value as 'always' | 'hover' | 'never' })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="always">{t('cellManager.labels.always')}</option>
                    <option value="hover">{t('cellManager.labels.hover')}</option>
                    <option value="never">{t('cellManager.labels.never')}</option>
                </select>
            </div>

            {/* Hover Effect */}
            <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">{t('cellManager.hoverEffect')}</label>
                <input
                    type="checkbox"
                    checked={grid.hoverEffect}
                    onChange={(e) => setGridSettings({ hoverEffect: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
            </div>

            {/* Enable Animations */}
            <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">{t('cellManager.enableAnimations')}</label>
                <input
                    type="checkbox"
                    checked={grid.enableAnimations}
                    onChange={(e) => setGridSettings({ enableAnimations: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
            </div>
        </div>
    );
};

export const PersistenceTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const { t } = useTranslation();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [lastExport, setLastExport] = useState<string | null>(null);
    const [lastImport, setLastImport] = useState<string | null>(null);

    if (!isActive) return null;

    const handleExportToFile = async () => {
        try {
            setIsExporting(true);
            const { save } = await import('@tauri-apps/plugin-dialog');

            // Show save dialog
            const filePath = await save({
                defaultPath: 'hexa-launcher-settings.json',
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });

            if (!filePath) {
                setIsExporting(false);
                return;
            }

            // Export settings
            // const {exportSettingsJson, saveSettingsToFile} = await import('../../utils/tauri');
            const settingsJson = await exportSettingsJson();
            await saveSettingsToFile(filePath, settingsJson);

            setLastExport(new Date().toLocaleString());
            alert('Settings exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportFromFile = async () => {
        try {
            setIsImporting(true);
            const { open } = await import('@tauri-apps/plugin-dialog');

            // Show open dialog
            const filePath = await open({
                multiple: false,
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });

            if (!filePath) {
                setIsImporting(false);
                return;
            }

            // Load settings from file
            // const {loadSettingsFromFile, saveSettings} = await import('../../utils/tauri');
            const settingsJson = await loadSettingsFromFile(filePath as string);
            const settings = JSON.parse(settingsJson);

            // Confirm import
            const confirmed = confirm(
                `Import settings?\n\n` +
                `Cells: ${settings.cells?.length || 0}\n` +
                `Groups: ${settings.groups?.length || 0}\n\n` +
                `This will overwrite your current settings.`
            );

            if (!confirmed) {
                setIsImporting(false);
                return;
            }

            // Import settings
            await saveSettings(settings);
            setLastImport(new Date().toLocaleString());
            alert('Settings imported successfully! Please reload the app.');

            // Reload the app
            window.location.reload();
        } catch (error) {
            console.error('Import failed:', error);
            alert(`Import failed: ${error}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleCopyToClipboard = async () => {
        try {
            // const {exportSettingsJson} = await import('../../utils/tauri');
            const settingsJson = await exportSettingsJson();
            await navigator.clipboard.writeText(settingsJson);
            alert('Settings copied to clipboard!');
            setLastExport(new Date().toLocaleString());
        } catch (error) {
            console.error('Copy failed:', error);
            alert(`Copy failed: ${error}`);
        }
    };

    const handlePasteFromClipboard = async () => {
        try {
            setIsImporting(true);
            const clipboardText = await navigator.clipboard.readText();

            // Validate JSON
            let settings;
            try {
                settings = JSON.parse(clipboardText);
            } catch {
                alert('Invalid JSON in clipboard');
                setIsImporting(false);
                return;
            }

            // Confirm import
            const confirmed = confirm(
                `Import settings from clipboard?\n\n` +
                `Cells: ${settings.cells?.length || 0}\n` +
                `Groups: ${settings.groups?.length || 0}\n\n` +
                `This will overwrite your current settings.`
            );

            if (!confirmed) {
                setIsImporting(false);
                return;
            }

            // Import settings
            // const {saveSettings} = await import('../../utils/tauri');
            await saveSettings(settings);
            setLastImport(new Date().toLocaleString());
            alert('Settings imported successfully! Please reload the app.');

            // Reload the app
            window.location.reload();
        } catch (error) {
            console.error('Paste import failed:', error);
            alert(`Paste import failed: ${error}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold mb-4 text-white">{t('settings.persistence')}</h2>

            {/* Export Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">{t('persistence.exportSettings')}</h3>
                <p className="text-sm text-gray-400">{t('persistence.exportDescription')}</p>

                <div className="flex gap-3">
                    <button
                        onClick={handleExportToFile}
                        disabled={isExporting}
                        className={clsx(
                            "px-4 py-2 rounded-lg border transition-all",
                            isExporting
                                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gray-700 border-cyan-500 text-white hover:bg-gray-600"
                        )}
                    >
                        {isExporting ? t('persistence.exporting') : t('persistence.exportToFile')}
                    </button>
                    <button
                        onClick={handleCopyToClipboard}
                        className="px-4 py-2 rounded-lg border bg-gray-700 border-gray-600 text-white hover:bg-gray-600 transition-all"
                    >
                        {t('persistence.copyToClipboard')}
                    </button>
                </div>
            </div>

            {/* Import Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">{t('persistence.importSettings')}</h3>
                <p className="text-sm text-gray-400">{t('persistence.importDescription')}</p>

                <div className="flex gap-3">
                    <button
                        onClick={handleImportFromFile}
                        disabled={isImporting}
                        className={clsx(
                            "px-4 py-2 rounded-lg border transition-all",
                            isImporting
                                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gray-700 border-cyan-500 text-white hover:bg-gray-600"
                        )}
                    >
                        {isImporting ? t('persistence.importing') : t('persistence.importFromFile')}
                    </button>
                    <button
                        onClick={handlePasteFromClipboard}
                        disabled={isImporting}
                        className={clsx(
                            "px-4 py-2 rounded-lg border transition-all",
                            isImporting
                                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        )}
                    >
                        {t('persistence.pasteFromClipboard')}
                    </button>
                </div>

                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <p className="text-xs text-yellow-300">
                        ⚠️ {t('persistence.importWarning')}
                    </p>
                </div>
            </div>

            {/* Status Section */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400">{t('persistence.status')}</h3>
                <div className="text-sm text-gray-300">
                    <p>{t('persistence.lastExport')}: {lastExport || t('common.never')}</p>
                    <p>{t('persistence.lastImport')}: {lastImport || t('common.never')}</p>
                </div>
            </div>
        </div>
    );
};

export const SecurityTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const { t } = useTranslation();
    const security = useLauncherStore(state => state.security);
    const setSecuritySettings = useLauncherStore(state => state.setSecuritySettings);
    const resetSecuritySettings = useLauncherStore(state => state.resetSecuritySettings);
    const [newPath, setNewPath] = useState('');

    if (!isActive) return null;

    const handleAddPath = () => {
        if (newPath.trim() && !security.trustedPaths.includes(newPath.trim())) {
            setSecuritySettings({
                trustedPaths: [...security.trustedPaths, newPath.trim()]
            });
            setNewPath('');
        }
    };

    const handleRemovePath = (path: string) => {
        setSecuritySettings({
            trustedPaths: security.trustedPaths.filter(p => p !== path)
        });
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{t('settings.security')}</h2>
                <button
                    onClick={resetSecuritySettings}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                >
                    {t('common.resetToDefaults')}
                </button>
            </div>

            {/* Admin Confirmation */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-white">{t('security.requireAdminConfirmation')}</label>
                    <p className="text-xs text-gray-400">{t('security.adminConfirmationDesc')}</p>
                </div>
                <input
                    type="checkbox"
                    checked={security.requireAdminConfirmation}
                    onChange={(e) => setSecuritySettings({ requireAdminConfirmation: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
            </div>

            {/* Launch Confirmation */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-white">{t('security.showLaunchConfirmation')}</label>
                    <p className="text-xs text-gray-400">{t('security.launchConfirmationDesc')}</p>
                </div>
                <input
                    type="checkbox"
                    checked={security.showLaunchConfirmation}
                    onChange={(e) => setSecuritySettings({ showLaunchConfirmation: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
            </div>

            {/* Trusted Paths */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-white mb-1">{t('security.trustedPaths')}</label>
                    <p className="text-xs text-gray-400">{t('security.trustedPathsDesc')}</p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newPath}
                        onChange={(e) => setNewPath(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddPath()}
                        placeholder="C:\Program Files\..."
                        className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                        onClick={handleAddPath}
                        className="px-4 py-2 rounded-lg border bg-gray-700 border-cyan-500 text-white hover:bg-gray-600 transition-all"
                    >
                        {t('common.add')}
                    </button>
                </div>

                {security.trustedPaths.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {security.trustedPaths.map((path, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded">
                                <span className="text-sm text-gray-300 truncate flex-1">{path}</span>
                                <button
                                    onClick={() => handleRemovePath(path)}
                                    className="ml-2 text-red-400 hover:text-red-300 text-xs"
                                >
                                    {t('common.remove')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const AdvancedTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const { t } = useTranslation();
    const advanced = useLauncherStore(state => state.advanced);
    const setAdvancedSettings = useLauncherStore(state => state.setAdvancedSettings);
    const resetAdvancedSettings = useLauncherStore(state => state.resetAdvancedSettings);
    const iconCacheIndex = useLauncherStore(state => state.iconCacheIndex);

    if (!isActive) return null;

    const handleClearIconCache = () => {
        if (confirm(t('advanced.clearIconCacheConfirm'))) {
            // Clear icon cache by resetting iconCacheIndex
            const { saveSettings } = require('../../utils/tauri');
            const state = useLauncherStore.getState();
            saveSettings({
                schemaVersion: 1,
                cells: Object.values(state.cells),
                groups: Object.values(state.groups),
                activeGroupId: state.activeGroupId,
                appearance: state.appearance,
                general: state.general,
                grid: state.grid,
                security: state.security,
                advanced: state.advanced,
                hotkeys: state.hotkeys,
                iconCacheIndex: {}, // Clear cache
                keyBindings: state.keyBindings,
            }).then(() => {
                alert(t('advanced.clearIconCacheSuccess'));
            }).catch(console.error);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{t('settings.advanced')}</h2>
                <button
                    onClick={resetAdvancedSettings}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                >
                    {t('common.resetToDefaults')}
                </button>
            </div>

            {/* Debug Mode */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-white">{t('advanced.debugMode')}</label>
                    <p className="text-xs text-gray-400">{t('advanced.debugModeDesc')}</p>
                </div>
                <input
                    type="checkbox"
                    checked={advanced.debugMode}
                    onChange={(e) => setAdvancedSettings({ debugMode: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
            </div>

            {/* Performance Metrics */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-white">{t('advanced.showPerformanceMetrics')}</label>
                    <p className="text-xs text-gray-400">{t('advanced.performanceMetricsDesc')}</p>
                </div>
                <input
                    type="checkbox"
                    checked={advanced.showPerformanceMetrics}
                    onChange={(e) => setAdvancedSettings({ showPerformanceMetrics: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
            </div>

            {/* Disable Animations */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-white">{t('advanced.disableAnimations')}</label>
                    <p className="text-xs text-gray-400">{t('advanced.disableAnimationsDesc')}</p>
                </div>
                <input
                    type="checkbox"
                    checked={advanced.disableAnimations}
                    onChange={(e) => setAdvancedSettings({ disableAnimations: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
            </div>

            {/* Custom CSS */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-white mb-1">Custom CSS</label>
                    <p className="text-xs text-gray-400">Add custom CSS to override default styles</p>
                </div>

                <textarea
                    value={advanced.customCSS}
                    onChange={(e) => setAdvancedSettings({ customCSS: e.target.value })}
                    placeholder="/* Enter custom CSS here */&#10;.hexagon {&#10;  /* your styles */&#10;}"
                    className="w-full h-48 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />

                <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <p className="text-xs text-yellow-300">
                        ⚠️ Warning: Custom CSS can break the UI. Use with caution. Changes apply immediately.
                    </p>
                </div>
            </div>

            {/* Icon Cache */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-white mb-1">Icon Cache</label>
                    <p className="text-xs text-gray-400">
                        Cached icons: {Object.keys(iconCacheIndex).length}
                    </p>
                </div>

                <button
                    onClick={handleClearIconCache}
                    className="px-4 py-2 rounded-lg border bg-gray-700 border-red-500 text-white hover:bg-gray-600 transition-all"
                >
                    Clear Icon Cache
                </button>
            </div>
        </div>
    );
};

export const HelpTab: React.FC<SettingsTabProps> = ({ isActive }) => {
    const { t } = useTranslation();
    const [version, setVersion] = useState('');
    const [appName, setAppName] = useState('');

    useEffect(() => {
        if (isActive) {
            import('@tauri-apps/api/app').then(async (app) => {
                try {
                    setVersion(await app.getVersion());
                    setAppName(await app.getName());
                } catch (e) {
                    console.error('Failed to get app info', e);
                    setVersion('Unknown');
                    setAppName('Hexa Launcher');
                }
            });
        }
    }, [isActive]);

    if (!isActive) return null;

    const handleOpenLink = async (url: string) => {
        try {
            // @ts-ignore
            const { open } = require('@tauri-apps/plugin-opener');
            await open(url);
        } catch (err) {
            console.error('Failed to open URL:', err);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold mb-4 text-white">{t('settings.help')}</h2>

            {/* Version Info */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-300">{t('help.versionInfo')}</h3>
                <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-400">{t('help.application')}:</span>
                        <span className="text-sm text-white font-mono">{appName || 'Hexa Launcher'} v{version || '...'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-400">{t('help.build')}:</span>
                        <span className="text-sm text-white font-mono">2025.12.06</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-400">{t('help.platform')}:</span>
                        <span className="text-sm text-white font-mono">Windows</span>
                    </div>
                </div>
            </div>

            {/* Documentation Links */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-300">{t('help.documentation')}</h3>
                <div className="space-y-2">
                    <button
                        onClick={() => handleOpenLink('https://github.com/Catharacta/hexa-launcher')}
                        className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-white">{t('help.githubRepo')}</p>
                                <p className="text-xs text-gray-400">{t('help.githubRepoDesc')}</p>
                            </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>

                    <button
                        onClick={() => handleOpenLink('https://github.com/Catharacta/hexa-launcher/wiki')}
                        className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-white">{t('help.userGuide')}</p>
                                <p className="text-xs text-gray-400">{t('help.userGuideDesc')}</p>
                            </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>

                    <button
                        onClick={() => handleOpenLink('https://github.com/Catharacta/hexa-launcher/issues')}
                        className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-white">{t('help.reportIssue')}</p>
                                <p className="text-xs text-gray-400">{t('help.reportIssueDesc')}</p>
                            </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Keyboard Shortcuts Reference */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-300">{t('help.keyboardShortcuts')}</h3>
                <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t('help.toggleLauncher')}</span>
                        <kbd className="px-2 py-1 bg-gray-800 rounded text-white font-mono text-xs">Alt+Space</kbd>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t('help.search')}</span>
                        <kbd className="px-2 py-1 bg-gray-800 rounded text-white font-mono text-xs">Ctrl+F</kbd>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t('help.navigate')}</span>
                        <kbd className="px-2 py-1 bg-gray-800 rounded text-white font-mono text-xs">Q/W/A/S/Z/X</kbd>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t('help.createGroup')}</span>
                        <kbd className="px-2 py-1 bg-gray-800 rounded text-white font-mono text-xs">Ctrl+G</kbd>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t('help.deleteCell')}</span>
                        <kbd className="px-2 py-1 bg-gray-800 rounded text-white font-mono text-xs">Delete</kbd>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                    {t('help.aboutDesc')}
                </p>
                <p className="text-xs text-gray-500">
                    {t('help.copyright')}
                </p>
            </div>
        </div>
    );
};
