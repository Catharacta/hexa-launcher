import React, { useEffect, useState, useMemo } from 'react';
// import { useTranslation } from 'react-i18next';
import { useLauncherStore } from '../../store/launcherStore';
import { getUwpApps } from '../../utils/tauri';
import { UwpApp } from '../../types/models';
import { IoClose, IoSearch } from 'react-icons/io5';
import { DiWindows } from 'react-icons/di';

export const UwpSelectorModal: React.FC = () => {
    // const { t } = useTranslation(); // Unused for now
    const isOpen = useLauncherStore(state => state.uwpSelectorOpen);
    const targetCellId = useLauncherStore(state => state.targetCellIdForUwp);
    const setOpen = useLauncherStore(state => state.setUwpSelectorOpen);
    const updateCell = useLauncherStore(state => state.updateCell);
    const appearance = useLauncherStore(state => state.appearance);

    const [apps, setApps] = useState<UwpApp[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getUwpApps().then(list => {
                // Sort alphabetically
                list.sort((a, b) => a.name.localeCompare(b.name));
                setApps(list);
            }).finally(() => {
                setLoading(false);
            });
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredApps = useMemo(() => {
        if (!searchTerm) return apps;
        const lower = searchTerm.toLowerCase();
        return apps.filter(app => app.name.toLowerCase().includes(lower));
    }, [apps, searchTerm]);

    const handleSelect = (app: UwpApp) => {
        if (targetCellId) {
            updateCell(targetCellId, {
                type: 'shortcut',
                title: app.name,
                icon: undefined, // Default icon or specific logic if we had icons
                shortcut: {
                    kind: 'uwp',
                    aumid: app.aumid,
                },
                // Legacy fields for compatibility if needed, though useFileDropHandler used shortcut.*
                target: app.aumid,
            });
        }
        setOpen(false);
    };

    if (!isOpen) return null;

    const isCyberpunk = appearance.style === 'cyberpunk';
    const bgColor = isCyberpunk ? 'bg-black/90' : 'bg-gray-900/90';
    const borderColor = isCyberpunk ? 'border-[#00f2ea]' : 'border-gray-700';
    const textColor = isCyberpunk ? 'text-[#00f2ea]' : 'text-gray-100';
    const inputBg = isCyberpunk ? 'bg-black/50' : 'bg-gray-800';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm pointer-events-auto"
            onClick={() => setOpen(false)}>
            <div
                className={`w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg border shadow-xl ${bgColor} ${borderColor} ${textColor}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${isCyberpunk ? 'border-[#00f2ea]/30' : 'border-gray-700'}`}>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <DiWindows className="text-2xl" />
                        Select UWP Application
                    </h2>
                    <button onClick={() => setOpen(false)} className="hover:opacity-70">
                        <IoClose className="text-2xl" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className={`flex items-center px-3 py-2 rounded border ${inputBg} ${borderColor}`}>
                        <IoSearch className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search apps..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-inherit placeholder-gray-500"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className={`animate-spin h-8 w-8 border-4 border-t-transparent rounded-full ${isCyberpunk ? 'border-[#00f2ea]' : 'border-white'}`}></div>
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No apps found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {filteredApps.map(app => (
                                <button
                                    key={app.aumid}
                                    onClick={() => handleSelect(app)}
                                    className={`flex items-center gap-3 p-3 rounded text-left transition-colors ${isCyberpunk
                                        ? 'hover:bg-[#00f2ea]/10 border border-transparent hover:border-[#00f2ea]/50'
                                        : 'hover:bg-gray-800 border border-transparent hover:border-gray-600'
                                        }`}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center rounded ${isCyberpunk ? 'bg-[#00f2ea]/20' : 'bg-gray-700'}`}>
                                        <DiWindows className="text-xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{app.name}</div>
                                        <div className="text-xs opacity-60 truncate">{app.aumid}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t text-xs text-right opacity-50 ${isCyberpunk ? 'border-[#00f2ea]/30' : 'border-gray-700'}`}>
                    {filteredApps.length} apps available
                </div>
            </div>
        </div>
    );
};
