import { LRUCache } from 'lru-cache';
import { invoke } from '@tauri-apps/api/core';

// Create LRU cache instance
// Max 500 items, default TTL 1 hour (though icons rarely change)
const cache = new LRUCache<string, string>({
    max: 500,
    ttl: 1000 * 60 * 60,
});

/**
 * フロントエンド側のアイコンキャッシュ管理クラス。
 * LRUキャッシュを使用してバックエンド（Tauri）への不要な呼び出しを削減します。
 */
class IconCache {
    /**
     * キャッシュからアイコンを取得、無ければバックエンドから取得してキャッシュします。
     * @param path ファイルパス
     * @param resolveShortcut ショートカット(.lnk)の実体アイコンを取得するかどうか
     * @returns Base64エンコードされたPNG画像文字列、またはnull
     */
    async getIcon(path: string, resolveShortcut: boolean = false): Promise<string | null> {
        // Cache key logic: append suffix if resolving shortcut
        const cacheKey = resolveShortcut ? `${path}:resolved` : path;

        // 1. Check Memory Cache
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey) || null;
        }

        // 2. Fetch from Backend
        try {
            const icon = await invoke<string>('get_file_icon', { path, resolveShortcut });
            if (icon) {
                cache.set(cacheKey, icon);
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
