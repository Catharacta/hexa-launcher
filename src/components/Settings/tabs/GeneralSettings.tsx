import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLauncherStore } from '../../../store/launcherStore';
import { SettingsSection } from '../shared/SettingsSection';
import { SettingsToggle } from '../shared/SettingsToggle';
import { SettingsSelect } from '../shared/SettingsSelect';
import { getStartupStatus, setStartup, setAlwaysOnTop } from '../../../utils/tauri';
import i18n from '../../../i18n/config';

export const GeneralSettings: React.FC = () => {
    const { t } = useTranslation();
    const general = useLauncherStore(state => state.general);
    const setGeneralSettings = useLauncherStore(state => state.setGeneralSettings);
    const resetGeneralSettings = useLauncherStore(state => state.resetGeneralSettings);

    // Optimistic UI: Initialize with stored value (or false if undefined)
    const [startupEnabled, setStartupEnabled] = useState(general.startOnBoot ?? false);

    // Check status in background, don't block UI
    useEffect(() => {
        getStartupStatus()
            .then((enabled: boolean) => {
                // Only update if different from store/state to avoid unnecessary renders
                if (enabled !== general.startOnBoot) {
                    setStartupEnabled(enabled);
                    setGeneralSettings({ startOnBoot: enabled });
                }
            })
            .catch(console.error);
    }, []);

    const handleStartupToggle = async (checked: boolean) => {
        // Optimistic update
        setStartupEnabled(checked);
        setGeneralSettings({ startOnBoot: checked });

        try {
            await setStartup(checked);
        } catch (error) {
            console.error('Failed to toggle startup', error);
            // Revert on failure
            const reverted = !checked;
            setStartupEnabled(reverted);
            setGeneralSettings({ startOnBoot: reverted });
        }
    };

    const handleAlwaysOnTopToggle = async (checked: boolean) => {
        try {
            await setAlwaysOnTop(checked);
            setGeneralSettings({ windowBehavior: { ...general.windowBehavior, alwaysOnTop: checked } });
        } catch (error) {
            console.error('Failed to set always on top', error);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsSection
                title={t('settings.general')}
                headerAction={
                    <button onClick={resetGeneralSettings} className="text-xs text-red-400 hover:text-red-300 underline">
                        {t('common.resetToDefaults')}
                    </button>
                }
            >
                <SettingsToggle
                    label={t('general.startOnBoot')}
                    description="Launch Hexa Launcher automatically when Windows starts"
                    checked={startupEnabled}
                    onChange={handleStartupToggle}
                />
                <SettingsToggle
                    label={t('general.selectCenterOnBoot')}
                    description={t('general.selectCenterOnBootDesc')}
                    checked={general.selectCenterOnBoot ?? true}
                    onChange={(checked) => setGeneralSettings({ selectCenterOnBoot: checked })}
                />

                <SettingsSelect
                    label={t('general.language')}
                    value={general.language}
                    options={[
                        { value: 'en', label: 'English' },
                        { value: 'ja', label: '日本語 (Japanese)' }
                    ]}
                    onChange={(val) => {
                        const lang = val as 'en' | 'ja';
                        setGeneralSettings({ language: lang });
                        i18n.changeLanguage(lang);
                    }}
                />
            </SettingsSection>

            <SettingsSection title={t('general.windowBehavior')}>
                <SettingsToggle
                    label={t('general.alwaysOnTop')}
                    description="Keep launcher window above other applications"
                    checked={general.windowBehavior.alwaysOnTop}
                    onChange={handleAlwaysOnTopToggle}
                />
                <SettingsToggle
                    label={t('general.hideOnBlur')}
                    description="Automatically hide when clicking outside the launcher"
                    checked={general.windowBehavior.hideOnBlur}
                    onChange={(checked) => setGeneralSettings({
                        windowBehavior: { ...general.windowBehavior, hideOnBlur: checked }
                    })}
                />
                <SettingsToggle
                    label={t('general.showOnMouseEdge')}
                    description="Reveal launcher when mouse touches screen edge"
                    checked={general.windowBehavior.showOnMouseEdge}
                    onChange={(checked) => setGeneralSettings({
                        windowBehavior: { ...general.windowBehavior, showOnMouseEdge: checked }
                    })}
                />
            </SettingsSection>
        </div>
    );
};
