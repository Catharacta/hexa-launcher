import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Cell } from '../types/models';
import { THEMES } from '../utils/theme';
import { clsx } from 'clsx';
import { useLauncherStore } from '../store/launcherStore';
import { getFileIcon } from '../utils/tauri';
import { convertFileSrc } from '@tauri-apps/api/core';
import { ClockWidget } from './Widgets/ClockWidget';
import { SystemWidget } from './Widgets/SystemWidget';

/**
 * 六角形セルのプロパティ定義。
 */
export interface HexagonProps {
    /** 表示するセルのデータモデル */
    cell: Cell;
    /** 六角形のサイズ（中心から頂点までの距離） */
    size: number;
    /** 描画位置 X座標 */
    x: number;
    /** 描画位置 Y座標 */
    y: number;
    /** クリック時のイベントハンドラ */
    onClick?: (e: React.MouseEvent) => void;
    /** 右クリック時のイベントハンドラ */
    onContextMenu?: (e: React.MouseEvent) => void;
    /** マウスダウン時のイベントハンドラ（ドラッグ開始用） */
    onMouseDown?: (e: React.MouseEvent) => void;
    /** テーマカラー（Cyberpunkモード以外で使用） */
    themeColor?: string;
    /** ドラッグ中かどうか（半透明表示に使用） */
    isDragging?: boolean;
    /** ドラッグのターゲット（交換先）になっているか */
    isDragTarget?: boolean;
    /** ドラッグ中のゴースト表示かどうか */
    isGhost?: boolean;
    /** 選択状態かどうか（キーボード操作時など） */
    isSelected?: boolean;
    /** 検索結果に一致しているか */
    isSearchMatch?: boolean;
    /** 検索モードがアクティブかどうか（非一致セルの非強調表示に使用） */
    isSearchActive?: boolean;
    /** ラベルの表示設定 ('always' | 'hover' | 'never') */
    showLabel?: 'always' | 'hover' | 'never';
    /** ホバーエフェクトを有効にするか */
    hoverEffect?: boolean;
}

/**
 * 六角形セル個体を描画するコンポーネント。
 *
 * SVGの `polygon` 要素を使用して六角形を描画し、その中にアイコンやテキストを配置します。
 * Cyberpunkテーマや選択状態、ドラッグ状態など、各種状態に応じたスタイルを動的に適用します。
 * `React.memo` でメモ化されており、プロパティに変更がない限り再レンダリングを抑制します。
 */
export const HexagonComponent: React.FC<HexagonProps> = ({
    cell,
    size,
    x,
    y,
    onClick,
    onContextMenu,
    onMouseDown,
    themeColor,
    isDragging = false,
    isDragTarget = false,
    isGhost = false,
    isSelected = false,
    isSearchMatch = false,
    isSearchActive = false,
    showLabel = 'hover',
    hoverEffect = true,
}) => {
    // Calculate hexagon points
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        points.push(`${size * Math.cos(angle_rad)},${size * Math.sin(angle_rad)}`);
    }
    const pointsStr = points.join(' ');

    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';
    const [iconUrl, setIconUrl] = useState<string | null>(cell.icon || null);

    useEffect(() => {
        let isMounted = true;
        const targetPath = cell.shortcut?.targetPath || cell.target;

        if (cell.customIcon) {
            const url = convertFileSrc(cell.customIcon);
            setIconUrl(url);
        } else if (!cell.icon && targetPath && cell.type !== 'launcher_setting') {
            getFileIcon(targetPath).then(icon => {
                if (isMounted && icon) {
                    setIconUrl(icon);
                }
            });
        } else {
            setIconUrl(cell.icon || null);
        }
        return () => { isMounted = false; };
    }, [cell.customIcon, cell.icon, cell.target, cell.shortcut?.targetPath, cell.type]);

    const effectiveColorName = isCyberpunk ? 'cyan' : (cell.themeColor || themeColor || 'cyan');
    const theme = THEMES[effectiveColorName] || THEMES['cyan'];

    const renderContent = (layerClass: string = "") => (
        <>
            {/* Main Hexagon Shape */}
            <polygon
                points={pointsStr}
                className={clsx(
                    layerClass,
                    "stroke-2 transition-all duration-200",

                    // Cyberpunk Styling
                    isCyberpunk && [
                        "cyberpunk-cell",
                        // Main Layer colors
                        !layerClass.includes('glitch') && "fill-[#0d0d0d] stroke-[#00f2ea]",
                        // Glitch Layer colors (Explicitly override base colors by exclusion)
                        layerClass.includes('cyberpunk-glitch-layer-1') && "fill-purple-900 stroke-purple-500",
                        layerClass.includes('cyberpunk-glitch-layer-2') && "fill-cyan-900 stroke-cyan-500",
                    ],

                    // Standard Theme Styling
                    !isCyberpunk && [
                        "fill-gray-800",
                        theme.stroke,
                        hoverEffect && "hover:fill-gray-700 hover:stroke-[3px] group-hover:filter",
                        isSelected && "fill-gray-700 stroke-[3px]"
                    ],

                    // Common overrides
                    isDragTarget && "stroke-[4px] stroke-white filter drop-shadow(0 0 8px rgba(255,255,255,0.8))",
                    (isSelected && isCyberpunk) && "stroke-[#00f2ea]", // Maintain selection stroke for main layer
                    isSearchMatch && "stroke-[4px] stroke-yellow-400 filter drop-shadow(0 0 10px rgba(250,204,21,0.8))"
                )}
                style={{
                    opacity: isSearchActive && !isSearchMatch ? 0.3 : 1,
                    ...((isSelected && !isCyberpunk) ? {
                        stroke: theme.color,
                        filter: `drop-shadow(0 0 8px ${theme.color}80)`
                    } : {})
                }}
            />

            {/* Content (Icon/Text) */}
            <foreignObject x={-size / 2} y={-size / 2} width={size} height={size} className={clsx("pointer-events-none", layerClass)}>
                {cell.type === 'widget' && cell.widget?.type === 'clock' ? (
                    <ClockWidget />
                ) : cell.type === 'widget' && cell.widget?.type === 'system' ? (
                    <SystemWidget />
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col text-center p-1 relative">
                        <div className={clsx(
                            "transition-transform duration-200 flex items-center justify-center",
                            showLabel === 'always' && "mb-1",
                            showLabel === 'hover' && "group-hover:-translate-y-2",
                            showLabel === 'hover' && isSelected && "-translate-y-2"
                        )}>
                            {cell.type === 'launcher_setting' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            ) : cell.type === 'group' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                </svg>
                            ) : cell.type === 'group_back' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                </svg>
                            ) : cell.type === 'group_close' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : cell.type === 'group_tree' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                                </svg>
                            ) : (

                                iconUrl ? (
                                    appearance.enableIconSilhouette ? (
                                        <div
                                            className={clsx("w-8 h-8", isCyberpunk ? "bg-[#00f2ea]" : "")}
                                            style={{
                                                maskImage: `url("${iconUrl}")`,
                                                WebkitMaskImage: `url("${iconUrl}")`,
                                                maskSize: 'contain',
                                                WebkitMaskSize: 'contain',
                                                maskRepeat: 'no-repeat',
                                                WebkitMaskRepeat: 'no-repeat',
                                                maskPosition: 'center',
                                                WebkitMaskPosition: 'center',
                                                backgroundColor: isCyberpunk ? '#00f2ea' : (theme.color || 'currentColor')
                                            }}
                                        />
                                    ) : (
                                        <img src={iconUrl} alt={cell.title} className="w-8 h-8 object-contain" />
                                    )
                                ) : (
                                    <Plus className={clsx("w-8 h-8", isCyberpunk ? "text-[#00f2ea]" : theme.text)} />
                                )
                            )}
                        </div>
                        {(showLabel === 'always' || (showLabel === 'hover' && !isGhost)) && (
                            <span
                                className={clsx(
                                    "text-[10px] truncate w-full px-1 transition-all duration-200",
                                    isCyberpunk ? "text-[#00f2ea]" : theme.textLight,
                                    showLabel === 'hover'
                                        ? clsx(
                                            "absolute bottom-1 left-0 right-0 opacity-0 group-hover:opacity-100",
                                            isSelected && "opacity-100"
                                        )
                                        : "opacity-100"
                                )}
                            >
                                {cell.title}
                            </span>
                        )}
                    </div>
                )}
            </foreignObject>
        </>
    );

    return (
        <g
            transform={`translate(${x},${y})`}
            onMouseEnter={() => {
                if (showLabel === 'hover' || showLabel === 'always') {
                    // Handled by CSS/parent state usually, but here we might trigger state
                }
            }}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onMouseDown={onMouseDown}
            className={clsx(
                "cursor-pointer group",
                isDragging && "opacity-50",
                isGhost && "opacity-30 pointer-events-none",
                // Add will-change for performance
                "will-change-transform"
            )}
            style={{
                filter: isDragging ? 'grayscale(100%)' : 'none'
            }}
        >
            <g className={clsx(
                "transition-transform duration-200 ease-out",
                !isGhost && !isDragging && (isSelected ? "scale-110" : "hover:scale-110"),
                !isGhost && !isDragging && "active:scale-95"
            )}>
                {/* Main Content Layer (Always visible, behind effects) */}
                {renderContent('cyberpunk-content-main')}

                {/* Glitch layers for cyberpunk theme (Overlay on top) */}
                {isCyberpunk && (
                    <>
                        {renderContent('cyberpunk-glitch-layer-1 !opacity-0 group-hover:!opacity-100')}
                        {renderContent('cyberpunk-glitch-layer-2 !opacity-0 group-hover:!opacity-100')}
                    </>
                )}
            </g>
        </g>
    );
};

export const Hexagon = React.memo(HexagonComponent);
