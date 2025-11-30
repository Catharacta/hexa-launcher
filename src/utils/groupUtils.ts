import { Cell, Group } from '../types/models';

export const createDefaultGroupCells = () => {
    const settingsCellId = crypto.randomUUID();
    const backCellId = crypto.randomUUID();
    const closeCellId = crypto.randomUUID();
    const treeCellId = crypto.randomUUID();

    const defaultCells: Cell[] = [
        {
            id: settingsCellId,
            type: 'launcher_setting',
            cube: { x: 0, y: 0, z: 0 },
            title: 'Settings',
        },
        {
            id: backCellId,
            type: 'group_back',
            cube: { x: -1, y: 1, z: 0 },
            title: 'Back',
        },
        {
            id: closeCellId,
            type: 'group_close',
            cube: { x: 1, y: -1, z: 0 },
            title: 'Close',
        },
        {
            id: treeCellId,
            type: 'group_tree',
            cube: { x: 0, y: -1, z: 1 },
            title: 'Tree',
        },
    ];

    return {
        ids: [settingsCellId, backCellId, closeCellId, treeCellId],
        cells: defaultCells
    };
};

export const deleteGroupRecursive = (
    targetGroupId: string,
    groups: Record<string, Group>,
    cells: Record<string, Cell>
) => {
    const group = groups[targetGroupId];
    if (!group) return;

    // We need to iterate over a copy of the cells array because we might modify it?
    // Actually we are modifying the 'cells' object passed in.
    // The group.cells array itself is not being modified while iterating, but the cells object is.

    group.cells.forEach((childCellId: string) => {
        const childCell = cells[childCellId];
        if (childCell) {
            if (childCell.type === 'group' && childCell.groupId) {
                deleteGroupRecursive(childCell.groupId, groups, cells);
            }
            delete cells[childCellId];
        }
    });

    delete groups[targetGroupId];
};
