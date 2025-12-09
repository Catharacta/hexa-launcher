import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLauncherStore } from '../../../store/launcherStore';
import { SettingsSection } from '../shared/SettingsSection';
import { SettingsToggle } from '../shared/SettingsToggle';
import { saveSettings } from '../../../utils/tauri';

export const AdvancedSettings: React.FC = () => {
    const { t } = useTranslation();
    const advanced = useLauncherStore(state => state.advanced);
    const setAdvancedSettings = useLauncherStore(state => state.setAdvancedSettings);
    const resetAdvancedSettings = useLauncherStore(state => state.resetAdvancedSettings);

    const handleClearIconCache = async () => {
        if (confirm(t('advanced.clearIconCacheConfirm'))) {
            try {
                const state = useLauncherStore.getState();
                await saveSettings({
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
                });
                alert(t('advanced.clearIconCacheSuccess'));
                window.location.reload();
            } catch (error) {
                console.error(error);
                alert('Failed to clear cache');
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsSection
                title={t('settings.advanced')}
                headerAction={
                    <button onClick={resetAdvancedSettings} className="text-xs text-red-400 hover:text-red-300 underline">
                        {t('common.resetToDefaults')}
                    </button>
                }
            >
                <SettingsToggle
                    label={t('advanced.debugMode')}
                    description={t('advanced.debugModeDesc')}
                    checked={advanced.debugMode}
                    onChange={(checked) => setAdvancedSettings({ debugMode: checked })}
                />
                <SettingsToggle
                    label={t('advanced.showPerformanceMetrics') || "Show Performance Metrics"}
                    checked={advanced.showPerformanceMetrics || false}
                    onChange={(checked) => setAdvancedSettings({ showPerformanceMetrics: checked })}
                />
                <SettingsToggle
                    label={t('advanced.disableAnimations') || "Disable Global Animations"}
                    description="Reduce motion for better performance"
                    checked={advanced.disableAnimations || false}
                    onChange={(checked) => setAdvancedSettings({ disableAnimations: checked })}
                />
            </SettingsSection>

            <SettingsSection title="Maintenance">
                <div className="flex justify-between items-center bg-red-900/10 p-3 rounded-lg border border-red-900/30">
                    <div>
                        <span className="block text-sm font-medium text-red-200">Icon Cache</span>
                        <span className="text-xs text-red-300/60">Clear cached icons to free up space</span>
                    </div>
                    <button
                        onClick={handleClearIconCache}
                        className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs rounded border border-red-800 transition-colors"
                    >
                        Clear Cache
                    </button>
                </div>
            </SettingsSection>
        </div>
    );
};
