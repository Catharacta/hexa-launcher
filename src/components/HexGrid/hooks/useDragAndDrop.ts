import { useState, useRef, useEffect } from 'react';
import { useLauncherStore } from '../../../store/launcherStore';
import { pixelToCube, cubeToPixel, cubeKey, HEX_SIZE } from '../../../utils/hexUtils';
import { Cell } from '../../../types/models';

export const useDragAndDrop = () => {
    const {
        cells: cellsMap,
        groups,
        activeGroupId,
        moveCell,
        moveCells,
        moveCellToGroup,
        selectedCellIds,
        selectCell,
        clearSelection,
        rootCellIds,
    } = useLauncherStore();

    const [draggedCellId, setDraggedCellId] = useState<string | null>(null);
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
    const [hoveredPlaceCube, setHoveredPlaceCube] = useState<{ x: number; y: number; z: number } | null>(null);
    const [hoveredTargetCellId, setHoveredTargetCellId] = useState<string | null>(null);

    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);

    // Cursor style during drag
    useEffect(() => {
        document.body.style.cursor = draggedCellId ? 'grabbing' : 'default';
    }, [draggedCellId]);

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

    return {
        draggedCellId,
        dragPosition,
        hoveredPlaceCube,
        hoveredTargetCellId,
        isDraggingRef,
        handleMouseDown
    };
};
