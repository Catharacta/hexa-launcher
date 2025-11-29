import Fuse from 'fuse.js';

export interface SearchableCell {
    id: string;
    title: string;
    target?: string;
    groupId?: string;
}

/**
 * Fuzzy search using Fuse.js
 * Tolerates typos and finds approximate matches
 */
export function fuzzySearch(
    cells: SearchableCell[],
    query: string,
    options?: { threshold?: number }
): string[] {
    if (!query.trim()) return [];

    const fuse = new Fuse(cells, {
        keys: [
            { name: 'title', weight: 0.7 },
            { name: 'target', weight: 0.3 }
        ],
        threshold: options?.threshold || 0.3,
        includeScore: true,
        ignoreLocation: true,
    });

    const results = fuse.search(query);
    return results.map(r => r.item.id);
}

/**
 * Partial match search
 * Simple substring matching (case-insensitive)
 */
export function partialSearch(
    cells: SearchableCell[],
    query: string
): string[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return cells
        .filter(cell =>
            cell.title.toLowerCase().includes(lowerQuery) ||
            cell.target?.toLowerCase().includes(lowerQuery)
        )
        .map(cell => cell.id);
}

/**
 * Regular expression search
 * Advanced pattern matching
 */
export function regexSearch(
    cells: SearchableCell[],
    query: string
): string[] {
    if (!query.trim()) return [];

    try {
        const regex = new RegExp(query, 'i');
        return cells
            .filter(cell =>
                regex.test(cell.title) ||
                (cell.target && regex.test(cell.target))
            )
            .map(cell => cell.id);
    } catch {
        // Invalid regex, return empty
        return [];
    }
}

/**
 * Main search function that delegates to the appropriate algorithm
 */
export function search(
    cells: SearchableCell[],
    query: string,
    mode: 'partial' | 'fuzzy' | 'regex' = 'fuzzy'
): string[] {
    switch (mode) {
        case 'partial':
            return partialSearch(cells, query);
        case 'fuzzy':
            return fuzzySearch(cells, query);
        case 'regex':
            return regexSearch(cells, query);
        default:
            return fuzzySearch(cells, query);
    }
}
