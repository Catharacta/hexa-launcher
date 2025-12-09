import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../../store/launcherStore';
import { SettingsSection } from '../shared/SettingsSection';
import { SettingsToggle } from '../shared/SettingsToggle';

export const SecuritySettings: React.FC = () => {
    const { t } = useTranslation();
    const security = useLauncherStore(state => state.security);
    const setSecuritySettings = useLauncherStore(state => state.setSecuritySettings);
    const resetSecuritySettings = useLauncherStore(state => state.resetSecuritySettings);
    const [newPath, setNewPath] = useState('');
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';

    const handleAddPath = () => {
        if (newPath.trim() && !security.trustedPaths.includes(newPath.trim())) {
            setSecuritySettings({
                trustedPaths: [...security.trustedPaths, newPath.trim()]
            });
            setNewPath('');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsSection
                title={t('settings.security')}
                headerAction={
                    <button onClick={resetSecuritySettings} className="text-xs text-red-400 hover:text-red-300 underline">
                        {t('common.resetToDefaults')}
                    </button>
                }
            >
                <SettingsToggle
                    label={t('security.requireAdminConfirmation')}
                    description={t('security.adminConfirmationDesc')}
                    checked={security.requireAdminConfirmation}
                    onChange={(checked) => setSecuritySettings({ requireAdminConfirmation: checked })}
                />
                <SettingsToggle
                    label={t('security.showLaunchConfirmation')}
                    description={t('security.launchConfirmationDesc')}
                    checked={security.showLaunchConfirmation}
                    onChange={(checked) => setSecuritySettings({ showLaunchConfirmation: checked })}
                />
            </SettingsSection>

            <SettingsSection
                title={t('security.trustedPaths')}
                description={t('security.trustedPathsDesc')}
            >
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newPath}
                        onChange={(e) => setNewPath(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddPath()}
                        placeholder="C:\Program Files\..."
                        className={clsx(
                            "flex-1 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all",
                            isCyberpunk
                                ? "bg-black/50 border border-[#00f2ea]/30 text-[#00f2ea] focus:ring-[#00f2ea]/50 placeholder-gray-600"
                                : "bg-gray-700 border border-gray-600 text-white focus:ring-cyan-500 placeholder-gray-400"
                        )}
                    />
                    <button
                        onClick={handleAddPath}
                        className={clsx(
                            "px-4 py-2 rounded-lg border transition-all text-sm font-medium",
                            isCyberpunk
                                ? "bg-[#00f2ea]/10 border-[#00f2ea] text-[#00f2ea] hover:bg-[#00f2ea]/20"
                                : "bg-gray-700 border-cyan-500 text-white hover:bg-gray-600"
                        )}
                    >
                        {t('common.add')}
                    </button>
                </div>

                {security.trustedPaths.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {security.trustedPaths.map((path, index) => (
                            <div
                                key={index}
                                className={clsx(
                                    "flex items-center justify-between px-3 py-2 rounded text-sm group",
                                    isCyberpunk
                                        ? "bg-black/30 border border-gray-800 hover:border-[#00f2ea]/30"
                                        : "bg-gray-700/50 hover:bg-gray-700"
                                )}
                            >
                                <span className="text-gray-300 truncate flex-1 font-mono text-xs">{path}</span>
                                <button
                                    onClick={() => setSecuritySettings({ trustedPaths: security.trustedPaths.filter(p => p !== path) })}
                                    className="ml-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    {t('common.remove')}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg">
                        No trusted paths configured
                    </div>
                )}
            </SettingsSection>
        </div>
    );
};
