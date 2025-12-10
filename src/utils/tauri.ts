import { invoke } from '@tauri-apps/api/core';
import { Settings } from '../types/models';
import { useLauncherStore } from '../store/launcherStore';
import i18n from '../i18n/config';

/**
 * 設定オブジェクトをバックエンドに保存します。
 *
 * @param settings 保存する設定オブジェクト
 * @throws 保存に失敗した場合エラーをスローします
 */
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
    const { addToast } = useLauncherStore.getState();

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
    try {
        await launchApp(path, args, workingDir);
    } catch (error) {
        console.error('Launch failed:', error);
        addToast(i18n.t('toast.error.launchFailed', { error: String(error) }), 'error');
    }
}

import { ResolvedShortcut, UwpApp } from '../types/models';

// ショートカット解決
export const resolveShortcut = async (path: string): Promise<ResolvedShortcut> => {
    try {
        return await invoke<ResolvedShortcut>('resolve_shortcut', { path });
    } catch (error) {
        console.error('Failed to resolve shortcut:', error);
        return { target: path, arguments: '', working_dir: '' }; // Fallback
    }
};

// UWP Apps
export const getUwpApps = async (): Promise<UwpApp[]> => {
    try {
        return await invoke<UwpApp[]>('get_uwp_apps');
    } catch (error) {
        console.error('Failed to get UWP apps:', error);
        return [];
    }
}

export const launchUwpApp = async (aumid: string): Promise<void> => {
    try {
        await invoke('launch_uwp_app', { aumid });
    } catch (error) {
        console.error('Failed to launch UWP app:', error);
        throw error;
    }
}

import { iconCache } from './iconCache';

export const getFileIcon = async (path: string): Promise<string | null> => {
    return await iconCache.getIcon(path);
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

export async function setHideOnBlur(enable: boolean): Promise<void> {
    // Backend command exists but frontend handles logic
    // Just calling it for completeness if needed in future
    try {
        await invoke('set_hide_on_blur', { enable });
    } catch (error) {
        console.error('Failed to set hide on blur:', error);
    }
}

export async function startMouseEdgeMonitor(): Promise<void> {
    try {
        await invoke('start_mouse_edge_monitor');
    } catch (error) {
        console.error('Failed to start mouse edge monitor:', error);
    }
}

export async function stopMouseEdgeMonitor(): Promise<void> {
    try {
        await invoke('stop_mouse_edge_monitor');
    } catch (error) {
        console.error('Failed to stop mouse edge monitor:', error);
    }
}