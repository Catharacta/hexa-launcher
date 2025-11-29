import { Cube } from './hex';

export type CellType = 'launcher_setting' | 'shortcut' | 'group' | 'unregistered' | 'close' | 'back' | 'tree' | 'group_back' | 'group_close' | 'group_tree' | 'app'; // 'app' kept for compatibility

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

export interface Settings {
    schemaVersion: number;
    cells: Cell[];
    groups: Group[];
    activeGroupId: string | null;
    appearance: AppearanceSettings;
    hotkeys: Record<string, string>;
    iconCacheIndex: Record<string, string>;
    keyBindings?: KeyBindings; // Optional for backward compatibility
    searchHistory?: string[]; // Recent search queries (max 10)
}
