import React, { useState, useRef, useEffect } from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { Hexagon } from './Hexagon';
import { ContextMenu } from './ContextMenu';
import { HEX_SIZE, cubeToPixel, pixelToCube, cubeAdd, cubeKey, CUBE_DIRECTIONS, detectEdgeIndex } from '../utils/hexUtils';
import { Cell } from '../types/models';
import { launchApp, hideWindow } from '../utils/tauri';

export const HexGrid: React.FC = () => {
    const {
        cells: cellsMap,
        groups,
        activeGroupId,
        appearance,
        addCell,
        updateCell,
        moveCell,
        moveCells,
        moveCellToGroup,
        selectedCellIds,
        selectCell,
        clearSelection,
        rootCellIds,
        setActiveGroup
    } = useLauncherStore();

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cellId: string } | null>(null);
    const [draggedCellId, setDraggedCellId] = useState<string | null>(null);
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
    const [hoveredPlaceCube, setHoveredPlaceCube] = useState<{ x: number; y: number; z: number } | null>(null);
    const [hoveredTargetCellId, setHoveredTargetCellId] = useState<string | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);

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

            setAnimationClass(direction === 'in' ? 'animate-zoom-in' : 'animate-zoom-out');
            prevGroupIdRef.current = activeGroupId;
        }
    }, [activeGroupId, groups]);

    // Filter cells based on active group
    const cells = activeGroupId
        ? (groups[activeGroupId]?.cells.map(id => cellsMap[id]).filter(Boolean) || [])
        : rootCellIds.map(id => cellsMap[id]).filter(Boolean);

    // Listen for shortcut updates (mock implementation if needed, or keep existing logic)
    // Assuming updateCell is stable and doesn't need re-subscription logic here for now

    // Cursor style during drag
    useEffect(() => {
        document.body.style.cursor = draggedCellId ? 'grabbing' : 'default';
    }, [draggedCellId]);

    const handleContextMenu = (e: React.MouseEvent, cellId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, cellId });
    };

    const handleHexClick = (cell: Cell, e: React.MouseEvent) => {
        if (isDraggingRef.current) return;

        e.stopPropagation();

        // Multi-selection with Ctrl/Shift
        if (e.ctrlKey || e.shiftKey) {
            selectCell(cell.id, true);
            return;
        } else {
            // If clicking without modifier, select only this cell
            selectCell(cell.id, false);
        }

        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        const clickX = e.clientX - svgRect.left;
        const clickY = e.clientY - svgRect.top;
        const center = cubeToPixel(cell.cube, HEX_SIZE);
        const centerX = center.x + window.innerWidth / 2;
        const centerY = center.y + window.innerHeight / 2;
        const edgeIndex = detectEdgeIndex({ x: centerX, y: centerY }, { x: clickX, y: clickY }, HEX_SIZE);
        if (edgeIndex !== null) {
            const direction = CUBE_DIRECTIONS[edgeIndex];
            const newCube = cubeAdd(cell.cube, direction);
            const newKey = cubeKey(newCube);
            const isOccupied = cells.some(c => cubeKey(c.cube) === newKey);
            if (isOccupied) {
                console.warn('Cell already exists at', newKey);
                return;
            }
            const newCell: Cell = {
                id: `cell-${Date.now()}`,
                type: 'app',
                cube: newCube,
                title: 'New App',
                icon: 'https://vitejs.dev/logo.svg',
            };
            addCell(newCell);
        } else {
            if (cell.type === 'app' && cell.target) {
                launchApp(cell.target, cell.args, cell.workingDir).catch(console.error);
            } else if (cell.type === 'shortcut' && cell.shortcut?.targetPath) {
                launchApp(cell.shortcut.targetPath, cell.shortcut.arguments, cell.shortcut.workingDirectory).catch(console.error);
            } else if (cell.type === 'launcher_setting') {
                useLauncherStore.getState().setSettingsOpen(true);
            } else if (cell.type === 'group' && cell.groupId) {
                setActiveGroup(cell.groupId);
            } else if (cell.type === 'group_back') {
                const currentGroup = activeGroupId ? groups[activeGroupId] : null;
                setActiveGroup(currentGroup?.parentId || null);
            } else if (cell.type === 'group_close') {
                hideWindow().catch(console.error);
            } else if (cell.type === 'group_tree') {
                useLauncherStore.getState().setTreeModalOpen(true);
            }
        }
    };

    const handleBackgroundClick = () => {
        clearSelection();
        setContextMenu(null);
    };

    const handleMouseDown = (cell: Cell, e: React.MouseEvent) => {
        if (e.button !== 0) return;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        isDraggingRef.current = false;

        if (!selectedCellIds.includes(cell.id) && !e.ctrlKey && !e.shiftKey) {
            selectCell(cell.id, false);
        }

        const handleWindowMouseMove = (moveEvent: MouseEvent) => {
            if (!dragStartRef.current) return;
            const dx = moveEvent.clientX - dragStartRef.current.x;
            const dy = moveEvent.clientY - dragStartRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                isDraggingRef.current = true;
                setDraggedCellId(cell.id);

                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                const currentDragX = moveEvent.clientX - centerX;
                const currentDragY = moveEvent.clientY - centerY;
                setDragPosition({ x: currentDragX, y: currentDragY });

                const hoveredCube = pixelToCube({ x: currentDragX, y: currentDragY }, HEX_SIZE);

                setHoveredPlaceCube(hoveredCube);
                setHoveredTargetCellId(null);
            }
        };

        const handleWindowMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);

            if (!isDraggingRef.current) {
                dragStartRef.current = null;
                return;
            }

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const dropX = upEvent.clientX - centerX;
            const dropY = upEvent.clientY - centerY;

            const newCube = pixelToCube({ x: dropX, y: dropY }, HEX_SIZE);
            const delta = {
                x: newCube.x - cell.cube.x,
                y: newCube.y - cell.cube.y,
                z: newCube.z - cell.cube.z
            };

            const state = useLauncherStore.getState();
            const movingCellIds = state.selectedCellIds.length > 0 ? state.selectedCellIds : [cell.id];

            // Filter non-moving cells based on CURRENT CONTEXT
            const currentContextCells = state.activeGroupId
                ? (state.groups[state.activeGroupId]?.cells.map(id => state.cells[id]).filter(Boolean) || [])
                : state.rootCellIds.map(id => state.cells[id]).filter(Boolean);

            const nonMovingCells = currentContextCells.filter(c => !movingCellIds.includes(c.id));

            // Check if dropped ONTO a group cell
            let droppedOnGroup: Cell | null = null;
            for (const nmc of nonMovingCells) {
                if (nmc.type === 'group' && nmc.groupId) {
                    const pixel = cubeToPixel(nmc.cube, HEX_SIZE);
                    const dist = Math.sqrt(Math.pow(pixel.x - dropX, 2) + Math.pow(pixel.y - dropY, 2));
                    if (dist < HEX_SIZE * 0.8) {
                        droppedOnGroup = nmc;
                        break;
                    }
                }
            }

            if (droppedOnGroup && droppedOnGroup.groupId) {
                // Move all moving cells to this group
                movingCellIds.forEach(id => {
                    moveCellToGroup(id, droppedOnGroup!.groupId!);
                });
                clearSelection();
            } else {
                let isOverlap = false;
                for (const id of movingCellIds) {
                    const c = state.cells[id];
                    if (!c) continue;
                    const targetCube = {
                        x: c.cube.x + delta.x,
                        y: c.cube.y + delta.y,
                        z: c.cube.z + delta.z
                    };
                    if (nonMovingCells.some(nmc => cubeKey(nmc.cube) === cubeKey(targetCube))) {
                        isOverlap = true;
                        break;
                    }
                }

                let isConnected = nonMovingCells.length === 0;
                if (!isConnected) {
                    for (const id of movingCellIds) {
                        const c = state.cells[id];
                        if (!c) continue;
                        const targetCube = {
                            x: c.cube.x + delta.x,
                            y: c.cube.y + delta.y,
                            z: c.cube.z + delta.z
                        };
                        if (nonMovingCells.some(nmc => {
                            const d = (Math.abs(targetCube.x - nmc.cube.x) + Math.abs(targetCube.y - nmc.cube.y) + Math.abs(targetCube.z - nmc.cube.z)) / 2;
                            return d <= 1;
                        })) {
                            isConnected = true;
                            break;
                        }
                    }
                }

                if (!isOverlap && isConnected) {
                    moveCells(movingCellIds, delta);
                } else if (movingCellIds.length === 1 && isOverlap && isConnected) {
                    const targetCube = {
                        x: cell.cube.x + delta.x,
                        y: cell.cube.y + delta.y,
                        z: cell.cube.z + delta.z
                    };
                    console.log('Swapping cell', cell.id, 'to', targetCube);
                    moveCell(cell.id, targetCube);
                } else {
                    console.log('Invalid move: Overlap or Disconnected');
                }
            }

            setDraggedCellId(null);
            setDragPosition(null);
            setHoveredTargetCellId(null);
            setHoveredPlaceCube(null);
            dragStartRef.current = null;
            isDraggingRef.current = false;
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
    };

    const draggedCell = draggedCellId ? cellsMap[draggedCellId] : null;

    return (
        <div
            className="w-full h-screen bg-gray-900 overflow-hidden flex items-center justify-center select-none relative"
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
                            size={HEX_SIZE}
                            x={cubeToPixel(hoveredPlaceCube, HEX_SIZE).x}
                            y={cubeToPixel(hoveredPlaceCube, HEX_SIZE).y}
                            isGhost
                        />
                    </g>
                )}

                <g key={activeGroupId || 'root'} className={animationClass}>
                    {cells.map(cell => {
                        const { x, y } = cubeToPixel(cell.cube, HEX_SIZE);
                        const isBeingDragged = cell.id === draggedCellId;
                        const isSwapTarget = cell.id === hoveredTargetCellId;
                        const isSelected = selectedCellIds.includes(cell.id);
                        return (
                            <Hexagon
                                key={cell.id}
                                cell={cell}
                                size={HEX_SIZE - 2}
                                x={x}
                                y={y}
                                onClick={(e) => handleHexClick(cell, e)}
                                onContextMenu={(e) => handleContextMenu(e, cell.id)}
                                onMouseDown={(e) => handleMouseDown(cell, e)}
                                themeColor={appearance.themeColor}
                                isDragging={isBeingDragged}
                                isDragTarget={isSwapTarget}
                                isSelected={isSelected}
                            />
                        );
                    })}
                </g>

                {/* Ghost Hexagon (dragging) */}
                {draggedCell && dragPosition && (
                    <g className="pointer-events-none opacity-80" style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}>
                        <Hexagon
                            cell={draggedCell}
                            size={HEX_SIZE - 2}
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
