import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import { getVersion } from '@tauri-apps/api/app';
// @ts-ignore
import { open } from '@tauri-apps/plugin-opener';
import { SettingsSection } from '../shared/SettingsSection';
import { useLauncherStore } from '../../../store/launcherStore';
import { clsx } from 'clsx';

export const HelpSettings: React.FC = () => {
    const { t } = useTranslation();
    const [appVersion, setAppVersion] = useState<string>('0.0.0');
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';

    useEffect(() => {
        getVersion().then(setAppVersion).catch(() => setAppVersion('Unknown'));
    }, []);

    const links = [
        { label: 'Documentation', url: 'https://github.com/your-repo/hexa-launcher' },
        { label: 'Report an Issue', url: 'https://github.com/your-repo/hexa-launcher/issues' },
        { label: 'Release Notes', url: 'https://github.com/your-repo/hexa-launcher/releases' },
    ];

    const openLink = async (url: string) => {
        try {
            await open(url);
        } catch (e) {
            console.error('Failed to open URL:', e);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center py-8">
                <h1 className={clsx(
                    "text-3xl font-bold mb-2 tracking-tighter",
                    isCyberpunk ? "text-[#00f2ea] drop-shadow-[0_0_10px_rgba(0,242,234,0.6)]" : "text-white"
                )}>
                    HEXA LAUNCHER
                </h1>
                <p className="text-gray-400 font-mono text-xs tracking-widest">
                    VERSION {appVersion}
                </p>
            </div>

            <SettingsSection title={t('settings.help')}>
                <div className="grid grid-cols-1 gap-3">
                    {links.map(link => (
                        <button
                            key={link.label}
                            onClick={() => openLink(link.url)}
                            className={clsx(
                                "flex items-center justify-between p-4 rounded-lg border transition-all group",
                                isCyberpunk
                                    ? "bg-black/40 border-gray-800 hover:border-[#00f2ea] hover:shadow-[0_0_10px_rgba(0,242,234,0.1)]"
                                    : "bg-gray-700/50 hover:bg-gray-700 hover:border-gray-500 border-gray-600"
                            )}
                        >
                            <span className={clsx("text-sm font-medium", isCyberpunk ? "text-gray-300 group-hover:text-[#00f2ea]" : "text-white")}>
                                {link.label}
                            </span>
                            <svg
                                className={clsx("w-4 h-4 transition-transform group-hover:translate-x-1", isCyberpunk ? "text-[#00f2ea]" : "text-gray-400")}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </div>
            </SettingsSection>

            <div className="text-center text-xs text-gray-600 mt-8">
                &copy; 2024 Hexa Launcher Team. MIT License.
            </div>
        </div>
    );
};
