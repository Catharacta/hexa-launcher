import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../store/launcherStore';

import { GeneralSettings } from './tabs/GeneralSettings';
import { AppearanceSettings } from './tabs/AppearanceSettings';
import { GridSettings } from './tabs/GridSettings';
import { KeybindingSettings } from './tabs/KeybindingSettings';
import { PersistenceSettings } from './tabs/PersistenceSettings';
import { SecuritySettings } from './tabs/SecuritySettings';
import { AdvancedSettings } from './tabs/AdvancedSettings';
import { HelpSettings } from './tabs/HelpSettings';

// Icons (using standard SVGs or lucide-react if available, here using SVGs for portability)
const Icons = {
    General: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    Appearance: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>,
    Grid: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l-9.53 6.94L3.61 22h16.78l1.14-13.06L12 2zm0 0v20"></path></svg>, // Simplified Hex/Grid
    Keybinding: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6" y2="8"></line><line x1="10" y1="8" x2="10" y2="8"></line><line x1="14" y1="8" x2="14" y2="8"></line><line x1="18" y1="8" x2="18" y2="8"></line><line x1="6" y1="12" x2="6" y2="12"></line><line x1="10" y1="12" x2="10" y2="12"></line><line x1="14" y1="12" x2="14" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="18" y2="16"></line></svg>,
    Persistence: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
    Security: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    Advanced: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>,
    Help: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
};

type TabId = 'general' | 'appearance' | 'keybinding' | 'cell' | 'persistence' | 'security' | 'advanced' | 'help';

export const SettingsModal: React.FC = () => {
    const { t } = useTranslation();
    const isSettingsOpen = useLauncherStore((state) => state.isSettingsOpen);
    const setSettingsOpen = useLauncherStore((state) => state.setSettingsOpen);
    const appearance = useLauncherStore((state) => state.appearance);

    const [activeTab, setActiveTab] = useState<TabId>('general');
    const isCyberpunk = appearance.style === 'cyberpunk';

    if (!isSettingsOpen) return null;

    const tabs: { id: TabId; label: string; icon: React.FC }[] = [
        { id: 'general', label: t('settings.general'), icon: Icons.General },
        { id: 'appearance', label: t('settings.appearance'), icon: Icons.Appearance },
        { id: 'cell', label: t('settings.cellManager'), icon: Icons.Grid },
        { id: 'keybinding', label: t('settings.keybinding'), icon: Icons.Keybinding },
        { id: 'persistence', label: t('settings.persistence'), icon: Icons.Persistence },
        { id: 'security', label: t('settings.security'), icon: Icons.Security },
        { id: 'advanced', label: t('settings.advanced'), icon: Icons.Advanced },
        { id: 'help', label: t('settings.help'), icon: Icons.Help },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettings />;
            case 'appearance': return <AppearanceSettings />;
            case 'cell': return <GridSettings />;
            case 'keybinding': return <KeybindingSettings />;
            case 'persistence': return <PersistenceSettings />;
            case 'security': return <SecuritySettings />;
            case 'advanced': return <AdvancedSettings />;
            case 'help': return <HelpSettings />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setSettingsOpen(false)}
            />

            {/* Modal Window */}
            <div className={clsx(
                "w-full max-w-5xl h-[85vh] flex overflow-hidden rounded-xl shadow-2xl relative z-10 transition-all border",
                isCyberpunk
                    ? "bg-black/85 border-[#00f2ea] shadow-[0_0_20px_rgba(0,242,234,0.3)] backdrop-blur-md"
                    : "bg-gray-900 border-gray-700 text-white"
            )}>

                {/* Sidebar */}
                <div className={clsx(
                    "w-64 flex flex-col border-r shrink-0",
                    isCyberpunk ? "bg-black/50 border-[#00f2ea]/30" : "bg-gray-800/50 border-gray-700"
                )}>
                    <div className="p-6 pb-2">
                        <h1 className={clsx(
                            "text-2xl font-bold tracking-tight",
                            isCyberpunk ? "text-[#00f2ea] drop-shadow-[0_0_5px_rgba(0,242,234,0.8)]" : "text-white"
                        )}>
                            {t('settings.title')}
                        </h1>
                        <div className={clsx("h-1 w-20 mt-2 rounded", isCyberpunk ? "bg-gradient-to-r from-[#00f2ea] to-transparent" : "bg-cyan-600")} />
                    </div>

                    <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? (isCyberpunk
                                                ? "text-[#00f2ea] bg-[#00f2ea]/10"
                                                : "bg-cyan-600 text-white shadow-md")
                                            : (isCyberpunk
                                                ? "text-gray-400 hover:text-[#00f2ea] hover:bg-[#00f2ea]/5"
                                                : "text-gray-400 hover:bg-gray-700 hover:text-white")
                                    )}
                                >
                                    {isActive && isCyberpunk && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00f2ea] shadow-[0_0_8px_#00f2ea]" />
                                    )}
                                    <Icon />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-700/50">
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className={clsx(
                                "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all",
                                isCyberpunk
                                    ? "border border-red-500/50 text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            )}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            {t('contextMenu.close')}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    <div className="p-8 max-w-4xl mx-auto">
                        <div className="mb-6">
                            <h2 className={clsx(
                                "text-2xl font-bold mb-1",
                                isCyberpunk ? "text-white" : "text-white"
                            )}>
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Configure your launcher preferences
                            </p>
                        </div>

                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};
