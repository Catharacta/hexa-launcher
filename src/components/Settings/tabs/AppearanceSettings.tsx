import React from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../../store/launcherStore';
import { SettingsSection } from '../shared/SettingsSection';
import { SettingsSlider } from '../shared/SettingsSlider';
import { SettingsToggle } from '../shared/SettingsToggle';
import { THEMES } from '../../../utils/theme';

export const AppearanceSettings: React.FC = () => {
    const { t } = useTranslation();
    const appearance = useLauncherStore(state => state.appearance);
    const setAppearance = useLauncherStore(state => state.setAppearance);
    const resetAppearance = useLauncherStore(state => state.resetAppearance);

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsSection
                title={t('settings.appearance')}
                headerAction={
                    <button onClick={resetAppearance} className="text-xs text-red-400 hover:text-red-300 underline">
                        {t('common.resetToDefaults')}
                    </button>
                }
            >
                {/* Visual Style Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('appearance.visualStyle')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setAppearance({ style: 'default' })}
                            className={clsx(
                                "px-4 py-3 rounded-lg border transition-all text-sm font-medium",
                                appearance.style === 'default'
                                    ? "bg-gray-700 border-cyan-500 text-white shadow-lg"
                                    : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"
                            )}
                        >
                            {t('appearance.style.default')}
                        </button>
                        <button
                            onClick={() => setAppearance({ style: 'cyberpunk' })}
                            className={clsx(
                                "px-4 py-3 rounded-lg border transition-all text-sm font-mono font-bold tracking-wider relative overflow-hidden group",
                                appearance.style === 'cyberpunk'
                                    ? "bg-black border-[#00f2ea] text-[#00f2ea] shadow-[0_0_15px_rgba(0,242,234,0.3)]"
                                    : "bg-gray-900 border-gray-700 text-gray-500 hover:text-[#00f2ea] hover:border-[#00f2ea]/50"
                            )}
                        >
                            <span className="relative z-10">{t('appearance.style.cyberpunk')}</span>
                            {appearance.style === 'cyberpunk' && (
                                <div className="absolute inset-0 bg-[#00f2ea]/10 animate-pulse" />
                            )}
                        </button>
                    </div>
                </div>

                <SettingsSlider
                    label={t('appearance.opacity')}
                    value={Math.round(appearance.opacity * 100)}
                    min={0}
                    max={100}
                    step={5}
                    unit="%"
                    onChange={(val) => setAppearance({ opacity: val / 100 })}
                />

                <SettingsToggle
                    label={t('appearance.showShortcutIcon')}
                    description={t('appearance.showShortcutIconDesc')}
                    checked={appearance.showShortcutIcon ?? true}
                    onChange={(checked) => setAppearance({ showShortcutIcon: checked })}
                />

                <SettingsToggle
                    label={t('appearance.silhouetteMode', 'Silhouette Icons')}
                    description={t('appearance.silhouetteModeDesc', 'Render icons as monochrome silhouettes matching the theme color')}
                    checked={appearance.enableIconSilhouette || false}
                    onChange={(checked) => setAppearance({ enableIconSilhouette: checked })}
                />

                <SettingsSection title={t('appearance.vfx', 'Visual Effects (VFX)')}>
                    <SettingsToggle
                        label={t('appearance.enableVFX', 'Enable Visual Effects')}
                        description={t('appearance.enableVFXDesc', 'Enable CRT overlay, chromatic aberration, and particle backgrounds (Cyberpunk style only)')}
                        checked={appearance.enableVFX !== false}
                        onChange={(checked) => setAppearance({ enableVFX: checked })}
                    />

                    {appearance.enableVFX !== false && (
                        <SettingsSlider
                            label={t('appearance.vfxIntensity', 'VFX Intensity')}
                            value={Math.round((appearance.vfxIntensity ?? 0.5) * 100)}
                            min={0}
                            max={100}
                            step={10}
                            unit="%"
                            onChange={(val) => setAppearance({ vfxIntensity: val / 100 })}
                        />
                    )}
                </SettingsSection>

                {/* Theme Color (Default Style Only) */}
                {appearance.style !== 'cyberpunk' && (
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            {t('appearance.themeColor')}
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {Object.values(THEMES).map((theme) => (
                                <button
                                    key={theme.name}
                                    onClick={() => setAppearance({ themeColor: theme.name })}
                                    className={clsx(
                                        "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center transform",
                                        appearance.themeColor === theme.name
                                            ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                            : "border-transparent hover:scale-105 hover:shadow-lg"
                                    )}
                                    style={{ backgroundColor: theme.color }}
                                    title={theme.label}
                                >
                                    {appearance.themeColor === theme.name && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white drop-shadow-md">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </SettingsSection>
        </div>
    );
};
