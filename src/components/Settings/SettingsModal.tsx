import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLauncherStore } from '../../store/launcherStore';
import {
    GeneralTab,
    AppearanceTab,
    KeybindingTab,
    CellManagerTab,
    PersistenceTab,
    SecurityTab,
    AdvancedTab,
    HelpTab,
} from './SettingsTab';

type TabId = 'general' | 'appearance' | 'keybinding' | 'cell' | 'persistence' | 'security' | 'advanced' | 'help';

export const SettingsModal: React.FC = () => {
    const { t } = useTranslation();
    const isSettingsOpen = useLauncherStore((state) => state.isSettingsOpen);
    const setSettingsOpen = useLauncherStore((state) => state.setSettingsOpen);
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(['general']));

    useEffect(() => {
        if (!visitedTabs.has(activeTab)) {
            setVisitedTabs(prev => {
                const newSet = new Set(prev);
                newSet.add(activeTab);
                return newSet;
            });
        }
    }, [activeTab, visitedTabs]);

    if (!isSettingsOpen) return null;

    const tabs: { id: TabId; label: string }[] = [
        { id: 'general', label: t('settings.general') },
        { id: 'appearance', label: t('settings.appearance') },
        { id: 'keybinding', label: t('settings.keybinding') },
        { id: 'cell', label: t('settings.cellManager') },
        { id: 'persistence', label: t('settings.persistence') },
        { id: 'security', label: t('settings.security') },
        { id: 'advanced', label: t('settings.advanced') },
        { id: 'help', label: t('settings.help') },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-gray-800 w-3/4 h-3/4 rounded-lg shadow-2xl flex overflow-hidden border border-gray-700">
                {/* Sidebar */}
                <div className="w-64 bg-gray-900 flex flex-col border-r border-gray-700">
                    <div className="p-4 border-b border-gray-700">
                        <h1 className="text-xl font-bold text-white">{t('settings.title')}</h1>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-6 py-3 transition-colors ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-700">
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        >
                            {t('contextMenu.close')}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-800 overflow-y-auto">
                    {visitedTabs.has('general') && (
                        <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                            <GeneralTab isActive={activeTab === 'general'} />
                        </div>
                    )}
                    {visitedTabs.has('appearance') && (
                        <div className={activeTab === 'appearance' ? 'block' : 'hidden'}>
                            <AppearanceTab isActive={activeTab === 'appearance'} />
                        </div>
                    )}
                    {visitedTabs.has('keybinding') && (
                        <div className={activeTab === 'keybinding' ? 'block' : 'hidden'}>
                            <KeybindingTab isActive={activeTab === 'keybinding'} />
                        </div>
                    )}
                    {visitedTabs.has('cell') && (
                        <div className={activeTab === 'cell' ? 'block' : 'hidden'}>
                            <CellManagerTab isActive={activeTab === 'cell'} />
                        </div>
                    )}
                    {visitedTabs.has('persistence') && (
                        <div className={activeTab === 'persistence' ? 'block' : 'hidden'}>
                            <PersistenceTab isActive={activeTab === 'persistence'} />
                        </div>
                    )}
                    {visitedTabs.has('security') && (
                        <div className={activeTab === 'security' ? 'block' : 'hidden'}>
                            <SecurityTab isActive={activeTab === 'security'} />
                        </div>
                    )}
                    {visitedTabs.has('advanced') && (
                        <div className={activeTab === 'advanced' ? 'block' : 'hidden'}>
                            <AdvancedTab isActive={activeTab === 'advanced'} />
                        </div>
                    )}
                    {visitedTabs.has('help') && (
                        <div className={activeTab === 'help' ? 'block' : 'hidden'}>
                            <HelpTab isActive={activeTab === 'help'} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
