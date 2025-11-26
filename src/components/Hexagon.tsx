import React, { useEffect, useState } from 'react';
import { Cell } from '../types/models';
import { THEMES } from '../utils/theme';
import { clsx } from 'clsx';
import { useLauncherStore } from '../store/launcherStore';
import { getFileIcon } from '../utils/tauri';

interface HexagonProps {
    cell: Cell;
    size: number; // Radius of the hexagon
    x: number; // Pixel x
    y: number; // Pixel y
    onClick?: (e: React.MouseEvent) => void;
    onEdgeClick?: (edgeIndex: number) => void;
    themeColor?: string;
    onMouseDown?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isDragging?: boolean;
    isDragTarget?: boolean;
    isSelected?: boolean;
    isGhost?: boolean;
}

export const Hexagon: React.FC<HexagonProps> = ({
    cell,
    size,
    x,
    y,
    onClick,
    onContextMenu,
    themeColor,
    onMouseDown,
    isDragging,
    isDragTarget,
    isSelected,
    isGhost
}) => {
    // Calculate hexagon points
    // Pointy-topped hexagon
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

        // If we have a target path but no icon (or if it's a shortcut type which implies we should check for a system icon),
        // we try to fetch it. 
        // Note: We might want to re-fetch if target changes even if icon exists, but for now let's rely on clearing icon in HexGrid.
        if (!cell.icon && targetPath && cell.type !== 'launcher_setting') {
            getFileIcon(targetPath).then(icon => {
                if (isMounted && icon) {
                    setIconUrl(icon);
                }
            });
        } else {
            setIconUrl(cell.icon || null);
        }
        return () => { isMounted = false; };
    }, [cell.icon, cell.target, cell.shortcut?.targetPath, cell.type]);

    // Determine effective theme color
    // In Cyberpunk mode, force cyan unless specifically overridden (though user asked for fixed cyan)
    const effectiveColorName = isCyberpunk ? 'cyan' : (cell.themeColor || themeColor || 'cyan');
    const theme = THEMES[effectiveColorName] || THEMES['cyan'];

    const renderContent = (layerClass: string = "") => (
        <>
            {/* Main Hexagon Shape */}
            <polygon
                points={pointsStr}
                className={clsx(
                    "stroke-2 transition-all duration-200",
                    isCyberpunk ? "fill-[#0d0d0d] cyberpunk-cell" : "fill-gray-800 hover:fill-gray-700 hover:stroke-[3px] group-hover:filter",
                    isCyberpunk ? "stroke-[#00f2ea]" : theme.stroke,
                    layerClass === 'cyberpunk-glitch-layer-1' && "fill-purple-900 stroke-purple-500",
                    layerClass === 'cyberpunk-glitch-layer-2' && "fill-cyan-900 stroke-cyan-500",
                    isDragTarget && "stroke-[4px] stroke-white filter drop-shadow(0 0 8px rgba(255,255,255,0.8))",
                    isSelected && "stroke-[3px] stroke-blue-500 filter drop-shadow(0 0 5px rgba(59,130,246,0.6))"
                )}
            />

            {/* Content (Icon/Text) */}
            <foreignObject x={-size / 2} y={-size / 2} width={size} height={size} className="pointer-events-none">
                <div className="w-full h-full flex items-center justify-center flex-col text-center p-1">
                    {cell.type === 'launcher_setting' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8 mb-1", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    ) : cell.type === 'group' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8 mb-1", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                    ) : cell.type === 'group_back' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8 mb-1", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                    ) : cell.type === 'group_close' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8 mb-1", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : cell.type === 'group_tree' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={clsx("w-8 h-8 mb-1", isCyberpunk ? "text-[#00f2ea]" : theme.text)}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                        </svg>
                    ) : (
                        iconUrl && <img src={iconUrl} alt={cell.title} className="w-8 h-8 mb-1 object-contain" />
                    )}
                    <span
                        className={clsx(
                            "text-[10px] truncate w-full px-1",
                            isCyberpunk ? "text-[#00f2ea]" : theme.textLight
                        )}
                    >
                        {cell.title}
                    </span>
                </div>
            </foreignObject>
        </>
    );

    return (
        <g
            transform={`translate(${x}, ${y})`}
            className={clsx("group cursor-pointer", isDragging && "opacity-50")}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onMouseDown={onMouseDown}
        >
            {/* Main Content */}
            <g className={clsx(isCyberpunk && "cyberpunk-content-main")}>
                {renderContent()}
            </g>

            {/* Glitch Layers (Only for Cyberpunk) */}
            {isCyberpunk && (
                <>
                    <g className="cyberpunk-glitch-layer-1 pointer-events-none opacity-0">
                        {renderContent('cyberpunk-glitch-layer-1')}
                    </g>
                    <g className="cyberpunk-glitch-layer-2 pointer-events-none opacity-0">
                        {renderContent('cyberpunk-glitch-layer-2')}
                    </g>
                </>
            )}
        </g>
    );
};
