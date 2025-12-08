import { LRUCache } from 'lru-cache';
import { invoke } from '@tauri-apps/api/core';

// Create LRU cache instance
// Max 500 items, default TTL 1 hour (though icons rarely change)
const cache = new LRUCache<string, string>({
    max: 500,
    ttl: 1000 * 60 * 60,
});

class IconCache {
    /**
     * Get icon from cache or fetch from backend
     * @param path File path
     * @returns Base64 encoded PNG or null
     */
    async getIcon(path: string): Promise<string | null> {
        // 1. Check Memory Cache
        if (cache.has(path)) {
            return cache.get(path) || null;
        }

        // 2. Fetch from Backend
        try {
            const icon = await invoke<string>('get_file_icon', { path });
            if (icon) {
                cache.set(path, icon);
            }
            return icon;
        } catch (error) {
            console.warn(`Failed to get icon for ${path}:`, error);
            return null;
        }
    }

    /**
     * Clear cache
     */
    clear() {
        cache.clear();
    }
}

export const iconCache = new IconCache();
