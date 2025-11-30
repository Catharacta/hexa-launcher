import { useEffect, RefObject } from 'react';
import { useLauncherStore } from '../../../store/launcherStore';
import { cubeToPixel, HEX_SIZE } from '../../../utils/hexUtils';
import { getFileIcon } from '../../../utils/tauri';

export const useFileDropHandler = (svgRef: RefObject<SVGSVGElement | null>) => {
    useEffect(() => {
        let unlistenDrop: (() => void) | undefined;

        // --- HTML5 Drag & Drop Handler ---
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'copy';
            }
            console.log('HTML5 DragOver event fired');
        };

        const handleDrop = async (e: DragEvent) => {
            console.log('HTML5 Drop event fired');
            e.preventDefault();
            e.stopPropagation();

            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) {
                console.log('No files in HTML5 drop event');
                return;
            }

            const file = files[0];
            const filePath = (file as any).path;

            if (!filePath) {
                console.warn('File path not found in HTML5 drop event.');
                useLauncherStore.getState().addToast('Could not get file path', 'error');
                return;
            }

            console.log('HTML5 Dropped file path:', filePath);

            // Calculate position
            const svg = svgRef.current;
            let finalX = 0;
            let finalY = 0;

            if (svg) {
                const point = svg.createSVGPoint();
                point.x = e.clientX;
                point.y = e.clientY;
                const ctm = svg.getScreenCTM();
                if (ctm) {
                    const svgPoint = point.matrixTransform(ctm.inverse());
                    finalX = svgPoint.x;
                    finalY = svgPoint.y;
                } else {
                    finalX = e.clientX - window.innerWidth / 2;
                    finalY = e.clientY - window.innerHeight / 2;
                }
            } else {
                finalX = e.clientX - window.innerWidth / 2;
                finalY = e.clientY - window.innerHeight / 2;
            }

            await processFileDrop(filePath, finalX, finalY);
        };

        // --- Tauri Event Handler (Fallback) ---
        const setupTauriListener = async () => {
            try {
                const { listen } = await import('@tauri-apps/api/event');
                console.log('Setting up Tauri file-drop listener...');

                unlistenDrop = await listen('file-drop', async (event: any) => {
                    console.log('Tauri file-drop event received:', event);
                    const payload = event.payload;

                    if (payload?.paths && payload?.paths.length > 0 && payload?.position) {
                        const filePath = payload.paths[0];
                        const position = payload.position;

                        // Handle DPI scaling: Tauri returns physical pixels, browser uses logical pixels
                        const scale = window.devicePixelRatio || 1;
                        const logicalX = position.x / scale;
                        const logicalY = position.y / scale;

                        console.log(`DPI Scale: ${scale}, Physical: (${position.x}, ${position.y}), Logical: (${logicalX}, ${logicalY})`);

                        // Convert screen position to SVG coordinates
                        const svg = svgRef.current;
                        let finalX = 0;
                        let finalY = 0;

                        if (svg) {
                            const point = svg.createSVGPoint();
                            point.x = logicalX;
                            point.y = logicalY;
                            const ctm = svg.getScreenCTM();
                            if (ctm) {
                                const svgPoint = point.matrixTransform(ctm.inverse());
                                finalX = svgPoint.x;
                                finalY = svgPoint.y;
                            } else {
                                finalX = logicalX - window.innerWidth / 2;
                                finalY = logicalY - window.innerHeight / 2;
                            }
                        } else {
                            finalX = logicalX - window.innerWidth / 2;
                            finalY = logicalY - window.innerHeight / 2;
                        }

                        await processFileDrop(filePath, finalX, finalY);
                    }
                });
            } catch (err) {
                console.error('Failed to setup Tauri listener:', err);
            }
        };

        // --- Common Processing Logic ---
        const processFileDrop = async (filePath: string, x: number, y: number) => {
            console.log('Processing file drop:', filePath, 'at', x, y);
            const { addToast } = useLauncherStore.getState();

            // Find the closest cell within range
            const state = useLauncherStore.getState();

            // Filter cells based on current view (active group or root)
            const visibleCells = state.activeGroupId
                ? (state.groups[state.activeGroupId]?.cells.map(id => state.cells[id]).filter(Boolean) || [])
                : state.rootCellIds.map(id => state.cells[id]).filter(Boolean);

            console.log('Visible cells count:', visibleCells.length);

            if (visibleCells.length === 0) {
                addToast('No visible cells to drop onto', 'warning');
                return;
            }

            let targetCell = null;
            let minDist = Infinity; // Start with Infinity to find absolute closest
            const THRESHOLD = HEX_SIZE * 1.5; // Allow slightly larger range

            // Use pixel coordinates for distance check to be more forgiving
            const dropX = x;
            const dropY = y;

            for (const cell of visibleCells) {
                const { x: cellX, y: cellY } = cubeToPixel(cell.cube, HEX_SIZE);
                const dist = Math.sqrt(Math.pow(cellX - dropX, 2) + Math.pow(cellY - dropY, 2));

                // console.log(`Cell ${cell.id}: pos(${Math.round(cellX)},${Math.round(cellY)}) dist=${Math.round(dist)}`);

                if (dist < minDist) {
                    minDist = dist;
                    targetCell = cell;
                }
            }

            console.log('Closest cell:', targetCell?.id, 'Distance:', minDist);

            // Only accept if within threshold
            if (minDist > THRESHOLD) {
                console.log(`Closest cell is too far (> ${THRESHOLD})`);
                addToast('Drop target too far from any cell', 'warning');
                return;
            }

            const fileName = filePath.split(/[\\\/]/).pop()?.replace(/\.(exe|lnk|url)$/i, '') || 'App';

            try {
                const icon = await getFileIcon(filePath);

                if (targetCell) {
                    if (targetCell.type === 'launcher_setting') {
                        addToast('Cannot modify settings cell', 'warning');
                        return;
                    }
                    if (['group_back', 'group_close', 'group_tree'].includes(targetCell.type)) {
                        addToast('Cannot modify navigation cell', 'warning');
                        return;
                    }

                    console.log('Updating cell:', targetCell.id);
                    state.updateCell(targetCell.id, {
                        type: 'shortcut',
                        title: fileName,
                        icon: icon || undefined,
                        shortcut: {
                            kind: 'file',
                            targetPath: filePath,
                        },
                        target: filePath
                    });
                    addToast(`Shortcut created: ${fileName}`, 'success');
                }
            } catch (error) {
                console.error('Failed to process file drop:', error);
                addToast('Failed to create shortcut', 'error');
            }
        };

        // Attach listeners
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);
        setupTauriListener();

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
            if (unlistenDrop) unlistenDrop();
        };
    }, []);
};
