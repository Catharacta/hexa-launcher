import { invoke } from '@tauri-apps/api/core';
import { Settings } from '../types/models';

// 保存
export async function saveSettings(settings: Settings): Promise<void> {
    try {
        await invoke('save_settings', { settings: JSON.stringify(settings) });
    } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
    }
}

// 読み込み
export async function loadSettings(): Promise<Settings | null> {
    try {
        const json = await invoke<string>('load_settings');
        if (!json) return null;
        return JSON.parse(json) as Settings;
    } catch (error) {
        console.error('Failed to load settings:', error);
        return null;
    }
}

// アプリ起動
export async function launchApp(
    path: string,
    args?: string,
    workingDir?: string
): Promise<void> {
    try {
        await invoke('launch_app', { path, args, workingDir });
    } catch (error) {
        console.error('Failed to launch app:', error);
        throw error;
    }
}

// ショートカット解決
export const resolveShortcut = async (path: string): Promise<string> => {
    try {
        return await invoke('resolve_shortcut', { path });
    } catch (error) {
        console.error('Failed to resolve shortcut:', error);
        return path; // Fallback to original path
    }
};

export const getFileIcon = async (path: string): Promise<string | null> => {
    try {
        return await invoke('get_file_icon', { path });
    } catch (error) {
        console.warn('Failed to get file icon:', error);
        return null;
    }
};

export const openDialog = async (options?: any): Promise<any> => {
    try {
        // Tauri v2 uses plugin-dialog
        const { open } = await import('@tauri-apps/plugin-dialog');
        return await open(options);
    } catch (error) {
        console.error('Failed to open dialog:', error);
        return null;
    }
};

export const hideWindow = async (): Promise<void> => {
    try {
        await invoke('hide_window');
    } catch (error) {
        console.error('Failed to hide window:', error);
    }
};