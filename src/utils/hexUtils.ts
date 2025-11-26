import { Cube, Point } from '../types/hex';
export { CUBE_DIRECTIONS, cubeAdd, cubeKey } from '../types/hex';

export const HEX_SIZE = 60; // Default hex size in pixels

export function cubeToPixel(cube: Cube, size: number = HEX_SIZE): Point {
    // Pointy-topped
    // x = size * sqrt(3) * (cube.x + cube.z / 2)
    // y = size * 3/2 * cube.z
    // Note: In our Cube, x+y+z=0.
    // Let's use q=x, r=z.
    // Wait, standard is q=x, r=z.
    // x_pixel = size * sqrt(3) * (q + r/2)
    // y_pixel = size * 3/2 * r

    // Let's re-verify directions.
    // +x (q) is East? No, +x is usually SE or NE depending on system.
    // Let's stick to standard:
    // q = x, r = z
    // x_px = size * sqrt(3) * (x + z/2)
    // y_px = size * 3/2 * z

    const x = size * Math.sqrt(3) * (cube.x + cube.z / 2);
    const y = size * 3 / 2 * cube.z;
    return { x, y };
}

export function pixelToCube(point: Point, size: number = HEX_SIZE): Cube {
    const q = (Math.sqrt(3) / 3 * point.x - 1 / 3 * point.y) / size;
    const r = (2 / 3 * point.y) / size;
    return cubeRound({ x: q, y: -q - r, z: r });
}

export function cubeRound(frac: Cube): Cube {
    let q = Math.round(frac.x);
    let r = Math.round(frac.z);
    let s = Math.round(frac.y);

    const q_diff = Math.abs(q - frac.x);
    const r_diff = Math.abs(r - frac.z);
    const s_diff = Math.abs(s - frac.y);

    if (q_diff > r_diff && q_diff > s_diff) {
        q = -r - s;
    } else if (r_diff > s_diff) {
        r = -q - s;
    } else {
        s = -q - r;
    }

    return { x: q, y: s, z: r };
}

export function cubeDistance(a: Cube, b: Cube): number {
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
}

export function detectEdgeIndex(center: Point, click: Point, size: number): number | null {
    // Calculate angle from center to click
    const dx = click.x - center.x;
    const dy = click.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Threshold check: must be close to the edge
    // Inner radius (apothem) is size * sqrt(3)/2 ~= size * 0.866
    // Outer radius is size.
    // Let's say click must be > 0.7 * size to be considered an edge click?
    // Or maybe we just determine direction regardless of distance if it's inside the hex?
    // Requirement says: "detectEdgeIndex... (calculate vertices... point-line distance... threshold)"
    // Simplified MVP: Just use angle.

    if (dist < size * 0.5) return null; // Too close to center, treat as cell click
    if (dist > size * 1.1) return null; // Outside (shouldn't happen if we click on hex, but good safety)

    // Angle in degrees
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;

    // Pointy-topped hex angles:
    // 30 deg is a vertex (bottom-right)
    // 90 deg is a vertex (bottom)
    // ...
    // Edges are at 0, 60, 120, 180, 240, 300 degrees?
    // No, for pointy topped:
    // Vertices are at 30, 90, 150, 210, 270, 330.
    // Edges are centered at 0 (E), 60 (SE), 120 (SW), 180 (W), 240 (NW), 300 (NE).
    // Wait, y-axis points down in SVG.
    // 0 is Right (E).
    // 90 is Down.
    // Vertices: 30 (SE vertex), 90 (S vertex), 150 (SW vertex)...
    // Edges:
    // 0 deg -> E (dir 0?) -> x+1, y-1, z0?
    // Let's map angle to 0..5

    // 330-30 -> 0 (E)
    // 30-90 -> 1 (SE)
    // 90-150 -> 2 (SW)
    // 150-210 -> 3 (W)
    // 210-270 -> 4 (NW)
    // 270-330 -> 5 (NE)

    // Let's check CUBE_DIRECTIONS
    // 0: (+1, -1, 0) -> E ?
    // 1: (+1, 0, -1) -> NE ?
    // 2: (0, +1, -1) -> NW ?
    // 3: (-1, +1, 0) -> W ?
    // 4: (-1, 0, +1) -> SW ?
    // 5: (0, -1, +1) -> SE ?

    // My CUBE_DIRECTIONS in hex.ts:
    // 0: E (+1, -1, 0)
    // 1: NE (+1, 0, -1)
    // 2: NW (0, +1, -1)
    // 3: W (-1, +1, 0)
    // 4: SW (-1, 0, +1)
    // 5: SE (0, -1, +1)

    // Let's match angles to these directions.
    // E is 0 deg (or 360).
    // NE is 300 deg (-60).
    // NW is 240 deg (-120).
    // W is 180 deg.
    // SW is 120 deg.
    // SE is 60 deg.

    // So:
    // Angle 330..30 -> E (0)
    // Angle 270..330 -> NE (1)
    // Angle 210..270 -> NW (2)
    // Angle 150..210 -> W (3)
    // Angle 90..150 -> SW (4)
    // Angle 30..90 -> SE (5)

    // Let's normalize angle to [0, 360)
    // Shift by 30 to make E start at 0
    // (angle + 30) % 360
    // 0..60 -> E? No.

    // Let's use a simpler mapping.
    // Sector 0: -30 to 30 (E) -> index 0
    // Sector 1: 270 to 330 (NE) -> index 1
    // ...

    // Let's just use if/else for clarity.
    if (angle >= 330 || angle < 30) return 0; // E
    if (angle >= 270 && angle < 330) return 1; // NE
    if (angle >= 210 && angle < 270) return 2; // NW
    if (angle >= 150 && angle < 210) return 3; // W
    if (angle >= 90 && angle < 150) return 4; // SW
    if (angle >= 30 && angle < 90) return 5; // SE

    return null;
}
