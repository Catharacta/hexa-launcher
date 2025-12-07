import { RefObject } from 'react';
import { useLauncherStore } from '../../../store/launcherStore';
import { Cell } from '../../../types/models';
import { launchAppWithSecurity, hideWindow } from '../../../utils/tauri';
import { cubeToPixel, cubeAdd, cubeKey, CUBE_DIRECTIONS, detectEdgeIndex, HEX_SIZE } from '../../../utils/hexUtils';

export const useCellHandlers = (
    svgRef: RefObject<SVGSVGElement | null>,
    isDraggingRef: React.MutableRefObject<boolean>,
    setContextMenu: (menu: { x: number; y: number; cellId: string } | null) => void
) => {
    const {
        cells: cellsMap,
        groups,
        activeGroupId,
        addCell,
        selectCell,
        clearSelection,
        rootCellIds,
        setActiveGroup
    } = useLauncherStore();

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

        // Filter cells based on active group
        const cells = activeGroupId
            ? (groups[activeGroupId]?.cells.map(id => cellsMap[id]).filter(Boolean) || [])
            : rootCellIds.map(id => cellsMap[id]).filter(Boolean);

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
                launchAppWithSecurity(cell.target, cell.args, cell.workingDir).catch(console.error);
            } else if (cell.type === 'shortcut' && cell.shortcut?.targetPath) {
                launchAppWithSecurity(cell.shortcut.targetPath, cell.shortcut.arguments, cell.shortcut.workingDirectory).catch(console.error);
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
        hideWindow().catch(console.error);
    };

    return {
        handleContextMenu,
        handleHexClick,
        handleBackgroundClick
    };
};
