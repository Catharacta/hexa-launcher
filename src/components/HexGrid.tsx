import React, { useState, useRef, useEffect } from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { Hexagon } from './Hexagon';
import { ContextMenu } from './ContextMenu';
import { cubeToPixel } from '../utils/hexUtils';
import { useKeyboardShortcuts } from './HexGrid/hooks/useKeyboardShortcuts';
import { useFileDropHandler } from './HexGrid/hooks/useFileDropHandler';
import { useDragAndDrop } from './HexGrid/hooks/useDragAndDrop';
import { useCellHandlers } from './HexGrid/handlers/cellHandlers';

export const HexGrid: React.FC = () => {
    const {
        cells: cellsMap,
        groups,
        activeGroupId,
        appearance,
        selectedCellIds,
        rootCellIds,
        grid, // Get grid settings
    } = useLauncherStore();

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cellId: string } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Animation logic
    const prevGroupIdRef = useRef<string | null>(null);
    const [animationClass, setAnimationClass] = useState<string>('');

    useEffect(() => {
        const prevGroupId = prevGroupIdRef.current;
        if (prevGroupId !== activeGroupId) {
            // Determine direction
            let direction = 'in'; // Default to zoom in (diving deeper)

            // If we are going to root (null) from a group, it's always out
            if (activeGroupId === null && prevGroupId !== null) {
                direction = 'out';
            }
            // If we are going from a child to a parent (check if prevGroup's parent is activeGroup)
            else if (prevGroupId && groups[prevGroupId]?.parentId === activeGroupId) {
                direction = 'out';
            }

            // Map animation speed setting to class
            const speedClass = grid.animationSpeed === 'fast' ? 'duration-150' : grid.animationSpeed === 'slow' ? 'duration-500' : 'duration-300';
            setAnimationClass(`${direction === 'in' ? 'animate-zoom-in' : 'animate-zoom-out'} ${speedClass}`);
            prevGroupIdRef.current = activeGroupId;
        }
    }, [activeGroupId, groups, grid.animationSpeed]);

    // Use HEX_SIZE from settings
    const currentHexSize = grid.hexSize;

    // Filter cells based on active group
    const cells = activeGroupId
        ? (groups[activeGroupId]?.cells.map(id => cellsMap[id]).filter(Boolean) || [])
        : rootCellIds.map(id => cellsMap[id]).filter(Boolean);

    // Custom Hooks
    const { hoveredCellId: fileDropHoveredCellId } = useFileDropHandler(svgRef);
    useKeyboardShortcuts();

    const {
        draggedCellId,
        dragPosition,
        hoveredPlaceCube,
        hoveredTargetCellId,
        isDraggingRef,
        handleMouseDown
    } = useDragAndDrop();

    const {
        handleContextMenu,
        handleHexClick,
        handleBackgroundClick
    } = useCellHandlers(svgRef, isDraggingRef, setContextMenu);

    const draggedCell = draggedCellId ? cellsMap[draggedCellId] : null;

    return (
        <div
            className="w-full h-screen bg-transparent overflow-hidden flex items-center justify-center select-none relative"
            onMouseDown={handleBackgroundClick}
            onDragOver={(e) => e.preventDefault()}
        >
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* ... (background rendering if any) ... */}
            </div>

            {/* Group Title Overlay */}
            {activeGroupId && (
                <div className="absolute top-4 left-4 z-50">
                    <span className="ml-4 text-white font-bold text-lg">
                        {groups[activeGroupId]?.title}
                    </span>
                </div>
            )}

            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`${-window.innerWidth / 2} ${-window.innerHeight / 2} ${window.innerWidth} ${window.innerHeight}`}
                className="w-full h-full"
                onMouseDown={(e) => {
                    if (e.target === svgRef.current) {
                        handleBackgroundClick();
                    }
                }}
            >
                {/* Render Placeholders for Move Target (Ghost for primary cell) */}
                {hoveredPlaceCube && draggedCellId && (
                    <g className="pointer-events-none opacity-30">
                        <Hexagon
                            cell={{
                                id: 'ghost',
                                type: 'app',
                                cube: hoveredPlaceCube,
                                title: '',
                            }}
                            size={currentHexSize}
                            x={cubeToPixel(hoveredPlaceCube, currentHexSize).x}
                            y={cubeToPixel(hoveredPlaceCube, currentHexSize).y}
                            isGhost
                        />
                    </g>
                )}

                <g key={activeGroupId || 'root'} className={animationClass}>
                    {cells.map(cell => {
                        const { x, y } = cubeToPixel(cell.cube, currentHexSize);
                        const isBeingDragged = cell.id === draggedCellId;
                        const isSwapTarget = cell.id === hoveredTargetCellId;
                        const isSelected = selectedCellIds.includes(cell.id);
                        const isFileDropTarget = cell.id === fileDropHoveredCellId;
                        return (
                            <Hexagon
                                key={cell.id}
                                cell={cell}
                                size={currentHexSize - 2}
                                x={x}
                                y={y}
                                onClick={(e) => handleHexClick(cell, e)}
                                onContextMenu={(e) => handleContextMenu(e, cell.id)}
                                onMouseDown={(e) => handleMouseDown(cell, e)}
                                themeColor={appearance.themeColor}
                                isDragging={isBeingDragged}
                                isDragTarget={isSwapTarget || isFileDropTarget}
                                isSelected={isSelected}
                                showLabel={grid.showLabels}
                                hoverEffect={grid.hoverEffect}
                            />
                        );
                    })}
                </g>

                {/* Ghost Hexagon (dragging) */}
                {draggedCell && dragPosition && (
                    <g className="pointer-events-none opacity-80" style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}>
                        <Hexagon
                            cell={draggedCell}
                            size={currentHexSize - 2}
                            x={dragPosition.x}
                            y={dragPosition.y}
                            themeColor={appearance.themeColor}
                        />
                    </g>
                )}
            </svg>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    cellId={contextMenu.cellId}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};
