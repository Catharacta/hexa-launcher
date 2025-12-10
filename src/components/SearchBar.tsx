import React, { useState, useEffect, useRef } from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { search, SearchableCell } from '../utils/searchUtils';
import { clsx } from 'clsx';

/**
 * アプリケーション内検索およびWeb検索機能を提供するコンポーネント。
 * Ctrl+F（または設定されたショートカット）で起動し、アプリ名やグループ名の検索を行えます。
 * 検索履歴の表示や選択もサポートしています。
 */
export const SearchBar: React.FC = () => {
    const {
        cells,
        groups,
        activeGroupId,
        appearance,
        searchQuery,
        searchHistory,
        searchResults,
        isSearchActive,
        setSearchActive,
        setSearchQuery,
        setSearchResults,
        addToSearchHistory,
    } = useLauncherStore();

    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when search bar opens
    useEffect(() => {
        if (isSearchActive && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchActive]);

    // Perform search when query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        // Get searchable cells based on scope
        let searchableCells: SearchableCell[] = [];

        if (appearance.searchScope === 'global') {
            // Search all cells
            searchableCells = Object.values(cells).map(cell => ({
                id: cell.id,
                title: cell.title,
                target: cell.target || cell.shortcut?.targetPath,
                groupId: cell.groupId,
            }));
        } else {
            // Search only current group
            const currentCells = activeGroupId
                ? (groups[activeGroupId]?.cells || [])
                : Object.keys(cells);

            searchableCells = currentCells.map(id => {
                const cell = cells[id];
                return {
                    id: cell.id,
                    title: cell.title,
                    target: cell.target || cell.shortcut?.targetPath,
                    groupId: cell.groupId,
                };
            }).filter(Boolean);
        }

        // Perform search
        const results = search(searchableCells, searchQuery, appearance.searchMode);
        setSearchResults(results);
    }, [searchQuery, cells, groups, activeGroupId, appearance.searchScope, appearance.searchMode, setSearchResults]);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setSelectedHistoryIndex(-1);
    };

    const handleClear = () => {
        setSearchQuery('');
        setSearchResults([]);
        inputRef.current?.focus();
    };

    const handleClose = () => {
        setSearchActive(false);
        setHistoryOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            addToSearchHistory(searchQuery);
            setHistoryOpen(false);
        }
    };

    const handleHistorySelect = (query: string) => {
        setSearchQuery(query);
        setHistoryOpen(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        } else if (e.key === 'ArrowDown' && searchHistory.length > 0) {
            e.preventDefault();
            setHistoryOpen(true);
            setSelectedHistoryIndex(prev =>
                prev < searchHistory.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp' && historyOpen) {
            e.preventDefault();
            setSelectedHistoryIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter' && selectedHistoryIndex >= 0) {
            e.preventDefault();
            handleHistorySelect(searchHistory[selectedHistoryIndex]);
        }
    };

    if (!isSearchActive) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-fade-in">
            <form onSubmit={handleSubmit} className="relative">
                {/* Search Input */}
                <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-2xl border border-gray-700">
                    {/* Search Icon */}
                    <svg
                        className="w-5 h-5 text-cyan-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>

                    {/* Input Field */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleQueryChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => searchHistory.length > 0 && setHistoryOpen(true)}
                        onBlur={() => setTimeout(() => setHistoryOpen(false), 200)}
                        placeholder="Search apps and groups..."
                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                    />

                    {/* Result Count */}
                    {searchQuery && (
                        <span className="text-sm text-gray-400 flex-shrink-0">
                            {searchResults.length} results
                        </span>
                    )}

                    {/* Clear Button */}
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
                    >
                        <span className="text-sm font-medium">ESC</span>
                    </button>
                </div>

                {/* Search History Dropdown */}
                {historyOpen && searchHistory.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                        {searchHistory.map((query, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleHistorySelect(query)}
                                className={clsx(
                                    "w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2",
                                    selectedHistoryIndex === index && "bg-gray-700"
                                )}
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{query}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Search Mode Indicator */}
                <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
                    Mode: {appearance.searchMode} | Scope: {appearance.searchScope}
                </div>
            </form>
        </div>
    );
};
