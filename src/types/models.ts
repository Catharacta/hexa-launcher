import { Cube } from './hex';

/**
 * ショートカット情報の詳細定義。
 * ファイル、リンク、UWPアプリ、URIなど、様々な種類のターゲットを表現します。
 */
export interface ShortcutInfo {
    /** ショートカットの種類 ('file': ファイル, 'lnk': ショートカットファイル, 'uwp': ストアアプリ, 'uri': URL) */
    kind: "file" | "lnk" | "uwp" | "uri";
    /** ターゲットのパス (実行ファイルやフォルダのパス) */
    targetPath?: string;
    /** 起動引数 */
    arguments?: string;
    /** 作業ディレクトリ */
    workingDirectory?: string;
    /** Application User Model ID (UWPアプリ起動用) */
    aumid?: string;
    /** URI (Webサイトやプロトコル起動用) */
    uri?: string;
    /** 管理者権限で実行するかどうか */
    runAsAdmin?: boolean;
    /** 起動時の警告レベル ('none': 警告なし, 'warn': 確認ダイアログ表示) */
    warningLevel?: "none" | "warn";
}

/**
 * Windowsショートカット(.lnk)の解決結果。
 */
export interface ResolvedShortcut {
    /** リンク先のパス */
    target: string;
    /** 引数 */
    arguments: string;
    /** 作業ディレクトリ */
    working_dir: string;
}

/**
 * UWP(Universal Windows Platform)アプリの情報。
 */
export interface UwpApp {
    /** アプリの表示名 */
    name: string;
    /** アプリID (AUMID) */
    aumid: string;
}

/**
 * ウィジェットの設定情報。
 */
export interface WidgetConfig {
    /** ウィジェットの種類 ('clock': 時計, 'system': システムモニター) */
    type: 'clock' | 'system';
    /** ウィジェット固有の設定 (JSONオブジェクト) */
    settings?: Record<string, any>;
}

/**
 * セルの種類を表すユニオン型。
 * - 'launcher_setting': 設定画面を開く特殊セル
 * - 'shortcut': 通常のアプリショートカット
 * - 'group': グループフォルダ
 * - 'widget': ウィジェット
 * - 'app': 下位互換用（shortcutと同じ扱い）
 * - その他: システム操作系セル
 */
export type CellType = 'launcher_setting' | 'shortcut' | 'group' | 'unregistered' | 'close' | 'back' | 'tree' | 'group_back' | 'group_close' | 'group_tree' | 'app' | 'widget';

/**
 * グリッド上の個々のセルを表すデータモデル。
 */
export interface Cell {
    /** セルの一意なID (UUID v4) */
    id: string;
    /** セルの種類 */
    type: CellType;
    /** 六角形グリッド上の座標 (キューブ座標系) */
    cube: Cube;
    /** 表示タイトル */
    title: string;
    /** 自動取得されたアイコンのパスまたはデータURI */
    icon?: string;
    /** ユーザーが設定したカスタムアイコンのパス */
    customIcon?: string;
    /** このセルのテーマカラー上書き設定 */
    themeColor?: string;

    /** ショートカット情報 (type='shortcut' | 'app' の場合) */
    shortcut?: ShortcutInfo;

    // --- 以下、互換性のために残されているレガシーフィールド ---
    /** @deprecated use shortcut.targetPath instead */
    target?: string;
    /** @deprecated use shortcut.arguments instead */
    args?: string;
    /** @deprecated use shortcut.workingDirectory instead */
    workingDir?: string;

    /** 所属するグループのID (type='group'の場合、このフィールドは使用されず、Groups側で管理される) */
    groupId?: string;

    /** システムアクションの種類 (type='close' | 'back' などの場合に使用) */
    action?: string;

    /** ウィジェット設定 (type='widget' の場合) */
    widget?: WidgetConfig;
}

/**
 * セルをまとめるグループ（フォルダ）の定義。
 */
export interface Group {
    /** グループID (UUID v4) */
    id: string;
    /** グループ名 */
    title: string;
    /** このグループに含まれるセルのIDリスト */
    cells: string[];
    /** 親グループのID (ルートグループの場合は undefined) */
    parentId?: string;
}

/**
 * 外観設定。
 */
export interface AppearanceSettings {
    /** ウィンドウの不透明度 (0.0 - 1.0) */
    opacity: number;
    /** テーマカラー (Hexコードまたはプリセット名) */
    themeColor: string;
    /** スタイルテーマ ('default' | 'cyberpunk') */
    style: 'default' | 'cyberpunk';
    /** 検索範囲 ('current': 現在のグループ, 'global': 全体) */
    searchScope: 'current' | 'global';
    /** 検索アルゴリズム ('partial': 部分一致, 'fuzzy': あいまい検索, 'regex': 正規表現) */
    searchMode: 'partial' | 'fuzzy' | 'regex';
    /** アイコンのシルエットモード有効化 (単色化) */
    enableIconSilhouette?: boolean;
}

/**
 * キーバインディング設定。
 */
export interface KeyBindings {
    /** ランチャーの表示/非表示トグル (例: "Alt+Space") */
    globalToggle: string;
    /** 六角形グリッドのナビゲーションキー */
    hexNav: {
        northEast: string;  // Default: "W"
        east: string;       // Default: "S"
        southEast: string;  // Default: "X"
        southWest: string;  // Default: "Z"
        west: string;       // Default: "A"
        northWest: string;  // Default: "Q"
    };
    /** 各種アクションのショートカット */
    actions: {
        createShortcutFile: string;   // "Ctrl+N"
        createShortcutFolder: string; // "Ctrl+Shift+N"
        createGroup: string;          // "Ctrl+G"
        renameCell: string;           // "F2"
        deleteCell: string;           // "Delete"
    };
    /** 方向キーによるセル生成時の修飾キー ("Shift", "Ctrl", "Alt") */
    directionalCreateModifier: string;
    /** 検索バーの表示 */
    search: string; // "Ctrl+F"
}

/**
 * 全般設定。
 */
export interface GeneralSettings {
    /** OS起動時にランチャーを自動起動するか */
    startOnBoot: boolean;
    /** 言語設定 */
    language: 'en' | 'ja';
    /** ウィンドウの挙動設定 */
    windowBehavior: {
        alwaysOnTop: boolean;      // 常に最前面に表示
        hideOnBlur: boolean;       // フォーカスが外れたら隠す
        showOnMouseEdge: boolean;  // マウスエッジで表示
    };
}

/**
 * グリッド表示設定。
 */
export interface GridSettings {
    /** 六角形のサイズ */
    hexSize: number;
    /** ギャップサイズ (現在は未使用の可能性あり) */
    gapSize: number;
    /** アニメーション速度 */
    animationSpeed: 'fast' | 'normal' | 'slow';
    /** ラベル表示設定 */
    showLabels: 'always' | 'hover' | 'never';
    /** ホバーエフェクトの有無 */
    hoverEffect: boolean;
    /** 全体のアニメーション有効化フラグ */
    enableAnimations: boolean;
}

/**
 * セキュリティ設定。
 */
export interface SecuritySettings {
    /** 管理者権限が必要なアプリの起動時に確認を行うか */
    requireAdminConfirmation: boolean;
    /** すべてのアプリ起動時に確認を行うか */
    showLaunchConfirmation: boolean;
    /** 確認をスキップする信頼されたパスのリスト */
    trustedPaths: string[];
}

/**
 * 高度な設定。
 */
export interface AdvancedSettings {
    /** デバッグモード有効化 */
    debugMode: boolean;
    /** パフォーマンス情報の表示 */
    showPerformanceMetrics: boolean;
    /** カスタムCSS */
    customCSS: string;
    /** UIアニメーションの強制無効化 */
    disableAnimations: boolean;
}

/**
 * アプリケーション全体の設定データ構造 (settings.jsonとして保存される)。
 */
export interface Settings {
    /** スキーマバージョン */
    schemaVersion: number;
    /** 全セルのリスト */
    cells: Cell[];
    /** 全グループのリスト */
    groups: Group[];
    /** 現在表示中のグループID (nullならルート) */
    activeGroupId: string | null;

    // --- 各種設定セクション ---
    appearance: AppearanceSettings;
    general?: GeneralSettings;
    grid?: GridSettings;
    security?: SecuritySettings;
    advanced?: AdvancedSettings;

    /** ホットキー設定 (旧形式、現在は keyBindings を推奨) */
    hotkeys: Record<string, string>;
    /** アイコンキャッシュのインデックス */
    iconCacheIndex: Record<string, string>;
    /** キーバインディング設定 */
    keyBindings?: KeyBindings;
    /** 検索履歴 (最大10件) */
    searchHistory?: string[];
}
