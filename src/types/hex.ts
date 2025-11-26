export interface Cube {
    x: number;
    y: number;
    z: number;
}

export interface Point {
    x: number;
    y: number;
}

export const CUBE_DIRECTIONS: Cube[] = [
    { x: +1, y: -1, z: 0 }, // E
    { x: +1, y: 0, z: -1 }, // NE
    { x: 0, y: +1, z: -1 }, // NW
    { x: -1, y: +1, z: 0 }, // W
    { x: -1, y: 0, z: +1 }, // SW
    { x: 0, y: -1, z: +1 }, // SE
];

export function cubeAdd(a: Cube, b: Cube): Cube {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function cubeKey(cube: Cube): string {
    return `${cube.x},${cube.y},${cube.z}`;
}

export function parseCubeKey(key: string): Cube {
    const [x, y, z] = key.split(',').map(Number);
    return { x, y, z };
}
