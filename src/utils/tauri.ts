import { invoke } from '@tauri-apps/api/core';
import { Settings } from '../types/models';
import { useLauncherStore } from '../store/launcherStore';

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

export async function launchAppWithSecurity(
    path: string,
    args?: string,
    workingDir?: string
): Promise<void> {
    const security = useLauncherStore.getState().security;
    const trustedPaths = security.trustedPaths;

    // 信頼できるパスチェック
    const isTrusted = trustedPaths.some(trustedPath =>
        path.toLowerCase().startsWith(trustedPath.toLowerCase())
    );

    // 起動確認ダイアログ
    if (security.showLaunchConfirmation && !isTrusted) {
        const confirmed = confirm(`Launch application?\n\n${path}`);
        if (!confirmed) return;
    }

    // 管理者権限チェック（簡易版）
    if (security.requireAdminConfirmation) {
        const requiresAdmin = path.toLowerCase().includes('regedit') ||
            path.toLowerCase().includes('cmd') ||
            path.toLowerCase().includes('powershell');

        if (requiresAdmin) {
            const confirmed = confirm(
                `This application may require administrator privileges.\n\n` +
                `${path}\n\n` +
                `Continue?`
            );
            if (!confirmed) return;
        }
    }

    // アプリ起動
    await launchApp(path, args, workingDir);
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

export const updateGlobalShortcut = async (shortcut: string): Promise<void> => {
    try {
        await invoke('update_global_shortcut', { shortcut });
    } catch (error) {
        console.error('Failed to update global shortcut:', error);
        throw error;
    }
};

// Persistence functions for export/import
export async function exportSettingsJson(): Promise<string> {
    try {
        return await invoke<string>('export_settings_json');
    } catch (error) {
        console.error('Failed to export settings:', error);
        throw error;
    }
}

export async function saveSettingsToFile(filePath: string, data: string): Promise<void> {
    try {
        await invoke('save_settings_to_file', { filePath, data });
    } catch (error) {
        console.error('Failed to save settings to file:', error);
        throw error;
    }
}

export async function loadSettingsFromFile(filePath: string): Promise<string> {
    try {
        return await invoke<string>('load_settings_from_file', { filePath });
    } catch (error) {
        console.error('Failed to load settings from file:', error);
        throw error;
    }
}

// Startup functions
export async function setStartup(enable: boolean): Promise<void> {
    try {
        await invoke('set_startup', { enable });
    } catch (error) {
        console.error('Failed to set startup:', error);
        throw error;
    }
}

export async function getStartupStatus(): Promise<boolean> {
    try {
        return await invoke<boolean>('get_startup_status');
    } catch (error) {
        console.error('Failed to get startup status:', error);
        return false;
    }
}

// Window behavior functions
export async function setAlwaysOnTop(enable: boolean): Promise<void> {
    try {
        await invoke('set_always_on_top', { enable });
    } catch (error) {
        console.error('Failed to set always on top:', error);
        throw error;
    }
}