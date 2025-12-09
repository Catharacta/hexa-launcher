import React from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../../store/launcherStore';
import { SettingsSection } from '../shared/SettingsSection';
import { SettingsSlider } from '../shared/SettingsSlider';
import { SettingsToggle } from '../shared/SettingsToggle';
import { SettingsSelect } from '../shared/SettingsSelect';

export const GridSettings: React.FC = () => {
    const { t } = useTranslation();
    const grid = useLauncherStore(state => state.grid);
    const setGridSettings = useLauncherStore(state => state.setGridSettings);
    const resetGridSettings = useLauncherStore(state => state.resetGridSettings);

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsSection
                title={t('settings.cellManager')}
                headerAction={
                    <button onClick={resetGridSettings} className="text-xs text-red-400 hover:text-red-300 underline">
                        {t('common.resetToDefaults')}
                    </button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingsSlider
                        label={t('cellManager.hexSize')}
                        value={grid.hexSize}
                        min={40}
                        max={100}
                        step={5}
                        unit="px"
                        onChange={(val) => setGridSettings({ hexSize: val })}
                    />
                    <SettingsSlider
                        label={t('cellManager.gapSize')}
                        value={grid.gapSize}
                        min={0}
                        max={20}
                        step={1}
                        unit="px"
                        onChange={(val) => setGridSettings({ gapSize: val })}
                    />
                </div>

                <SettingsSelect
                    label={t('cellManager.showLabels')}
                    value={grid.showLabels}
                    options={[
                        { value: 'always', label: t('cellManager.labels.always') },
                        { value: 'hover', label: t('cellManager.labels.hover') },
                        { value: 'never', label: t('cellManager.labels.never') }
                    ]}
                    onChange={(val) => setGridSettings({ showLabels: val as 'always' | 'hover' | 'never' })}
                />

                <div className="pt-2 border-t border-gray-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-3">{t('cellManager.animationSpeed')}</label>
                    <div className="flex bg-gray-700/50 p-1 rounded-lg">
                        {(['slow', 'normal', 'fast'] as const).map((speed) => (
                            <button
                                key={speed}
                                onClick={() => setGridSettings({ animationSpeed: speed })}
                                className={clsx(
                                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                                    grid.animationSpeed === speed
                                        ? "bg-cyan-600 text-white shadow-sm"
                                        : "text-gray-400 hover:text-gray-200"
                                )}
                            >
                                {t(`cellManager.speed.${speed}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <SettingsToggle
                        label={t('cellManager.hoverEffect')}
                        checked={grid.hoverEffect}
                        onChange={(checked) => setGridSettings({ hoverEffect: checked })}
                    />
                    <SettingsToggle
                        label={t('cellManager.enableAnimations')}
                        checked={grid.enableAnimations}
                        onChange={(checked) => setGridSettings({ enableAnimations: checked })}
                    />
                </div>
            </SettingsSection>
        </div>
    );
};
