import { Cube } from './hex';


export interface ShortcutInfo {
    kind: "file" | "lnk" | "uwp" | "uri";
    targetPath?: string;
    arguments?: string;
    workingDirectory?: string;
    aumid?: string;
    uri?: string;
    runAsAdmin?: boolean;
    warningLevel?: "none" | "warn";
}

export interface ResolvedShortcut {
    target: string;
    arguments: string;
    working_dir: string;
}

export interface UwpApp {
    name: string;
    aumid: string;
}

export type CellType = 'launcher_setting' | 'shortcut' | 'group' | 'unregistered' | 'close' | 'back' | 'tree' | 'group_back' | 'group_close' | 'group_tree' | 'app'; // 'app' kept for compatibility

export interface Cell {
    id: string;
    type: CellType;
    cube: Cube;
    title: string;
    icon?: string;
    themeColor?: string; // Optional override for this cell

    // For ShortcutCell
    shortcut?: ShortcutInfo;

    // Legacy fields (kept for compatibility during migration)
    target?: string;
    args?: string;
    workingDir?: string;

    // For GroupCell
    groupId?: string; // If type is group, this points to a Group

    // System specific (e.g. Close button, Back button)
    action?: string;
}

export interface Group {
    id: string;
    title: string;
    cells: string[]; // List of Cell IDs in this group
    parentId?: string; // Parent group ID (undefined for root)
}

export interface AppearanceSettings {
    opacity: number; // 0.0 - 1.0
    themeColor: string; // Hex color or preset name
    style: 'default' | 'cyberpunk';
    searchScope: 'current' | 'global'; // Search within current group or all groups
    searchMode: 'partial' | 'fuzzy' | 'regex'; // Search algorithm
    enableIconSilhouette?: boolean; // Monochrome silhouette mode
}

export interface KeyBindings {
    globalToggle: string;  // e.g., "Alt+Space"
    hexNav: {
        northEast: string;  // Default: "W"
        east: string;       // Default: "S"
        southEast: string;  // Default: "X"
        southWest: string;  // Default: "Z"
        west: string;       // Default: "A"
        northWest: string;  // Default: "Q"
    };
    actions: {
        createShortcutFile: string;   // "Ctrl+N"
        createShortcutFolder: string; // "Ctrl+Shift+N"
        createGroup: string;          // "Ctrl+G"
        renameCell: string;           // "F2"
        deleteCell: string;           // "Delete"
    };
    directionalCreateModifier: string; // "Shift", "Ctrl", "Alt"
    search: string; // "Ctrl+F"
}

export interface GeneralSettings {
    startOnBoot: boolean;
    language: 'en' | 'ja';
    windowBehavior: {
        alwaysOnTop: boolean;
        hideOnBlur: boolean;
        showOnMouseEdge: boolean;
    };
}

export interface GridSettings {
    hexSize: number; // Default: 60
    gapSize: number; // Default: 0? (Currently implicit in hex layout)
    animationSpeed: 'fast' | 'normal' | 'slow';
    showLabels: 'always' | 'hover' | 'never';
    hoverEffect: boolean;
    enableAnimations: boolean; // Enable/disable all animations
}

export interface SecuritySettings {
    requireAdminConfirmation: boolean;  // 管理者権限アプリの起動確認
    showLaunchConfirmation: boolean;    // すべてのアプリ起動前に確認
    trustedPaths: string[];             // 信頼できるパスのリスト
}

export interface AdvancedSettings {
    debugMode: boolean;              // デバッグモード
    showPerformanceMetrics: boolean; // パフォーマンスメトリクス表示
    customCSS: string;               // カスタムCSS
    disableAnimations: boolean;      // アニメーション無効化
}

export interface Settings {
    schemaVersion: number;
    cells: Cell[];
    groups: Group[];
    activeGroupId: string | null;
    appearance: AppearanceSettings;
    general?: GeneralSettings; // New
    grid?: GridSettings; // New
    security?: SecuritySettings; // New
    advanced?: AdvancedSettings; // New
    hotkeys: Record<string, string>;
    iconCacheIndex: Record<string, string>;
    keyBindings?: KeyBindings; // Optional for backward compatibility
    searchHistory?: string[]; // Recent search queries (max 10)
}
