import { cubeToPixel, pixelToCube, cubeRound, cubeDistance, detectEdgeIndex, findEmptyAdjacentCube, HEX_SIZE } from './hexUtils';
import { Cube, Point, cubeKey } from '../types/hex';

describe('hexUtils', () => {
    describe('cubeToPixel', () => {
        it('should convert center cube (0,0,0) to pixel (0,0)', () => {
            const cube: Cube = { x: 0, y: 0, z: 0 };
            const pixel = cubeToPixel(cube);
            expect(pixel.x).toBeCloseTo(0);
            expect(pixel.y).toBeCloseTo(0);
        });

        it('should convert neighbor cube correctly', () => {
            const cube: Cube = { x: 1, y: -1, z: 0 }; // East neighbor
            const pixel = cubeToPixel(cube);
            // x = size * sqrt(3) * (1 + 0/2) = size * sqrt(3)
            // y = size * 3/2 * 0 = 0
            expect(pixel.x).toBeCloseTo(HEX_SIZE * Math.sqrt(3));
            expect(pixel.y).toBeCloseTo(0);
        });
    });

    describe('pixelToCube', () => {
        it('should convert center pixel (0,0) to cube (0,0,0)', () => {
            const point: Point = { x: 0, y: 0 };
            const cube = pixelToCube(point);
            expect(cube.x).toBeCloseTo(0);
            expect(cube.y).toBeCloseTo(0);
            expect(cube.z).toBeCloseTo(0);
        });

        it('should round trip correctly', () => {
            const originalCube: Cube = { x: 2, y: -3, z: 1 };
            const pixel = cubeToPixel(originalCube);
            const resultCube = pixelToCube(pixel);
            expect(resultCube.x).toBe(originalCube.x);
            expect(resultCube.y).toBe(originalCube.y);
            expect(resultCube.z).toBe(originalCube.z);
        });
    });

    describe('cubeRound', () => {
        it('should round floating point cube coordinates to nearest integer cube', () => {
            const fracCube = { x: 1.1, y: -2.2, z: 1.1 }; // Sum is 0
            const rounded = cubeRound(fracCube);
            expect(rounded.x).toBe(1);
            expect(rounded.y).toBe(-2);
            expect(rounded.z).toBe(1);
        });
    });

    describe('cubeDistance', () => {
        it('should calculate distance between neighbors as 1', () => {
            const a: Cube = { x: 0, y: 0, z: 0 };
            const b: Cube = { x: 1, y: -1, z: 0 };
            expect(cubeDistance(a, b)).toBe(1);
        });

        it('should calculate distance correctly', () => {
            const a: Cube = { x: 0, y: 0, z: 0 };
            const b: Cube = { x: 2, y: -3, z: 1 };
            // abs(2) + abs(-3) + abs(1) = 2 + 3 + 1 = 6 / 2 = 3
            expect(cubeDistance(a, b)).toBe(3);
        });
    });

    describe('detectEdgeIndex', () => {
        it('should return null if click is too close to center', () => {
            const center: Point = { x: 0, y: 0 };
            const click: Point = { x: 1, y: 1 }; // Very close
            expect(detectEdgeIndex(center, click, HEX_SIZE)).toBeNull();
        });

        it('should return correct edge index for East', () => {
            const center: Point = { x: 0, y: 0 };
            // East is 0 degrees. Let's pick a point to the right, near edge.
            const click: Point = { x: HEX_SIZE * 0.9, y: 0 };
            expect(detectEdgeIndex(center, click, HEX_SIZE)).toBe(0);
        });

        it('should return correct edge index for South East', () => {
            const center: Point = { x: 0, y: 0 };
            // SE is 60 degrees.
            const angle = 60 * Math.PI / 180;
            const click: Point = {
                x: HEX_SIZE * 0.9 * Math.cos(angle),
                y: HEX_SIZE * 0.9 * Math.sin(angle)
            };
            expect(detectEdgeIndex(center, click, HEX_SIZE)).toBe(5);
        });
    });

    describe('findEmptyAdjacentCube', () => {
        it('should return first empty neighbor', () => {
            const start: Cube = { x: 0, y: 0, z: 0 };
            const occupied = new Set<string>();
            // First neighbor is E (+1, -1, 0)
            const result = findEmptyAdjacentCube(start, occupied);
            expect(result).toEqual({ x: 1, y: -1, z: 0 });
        });

        it('should skip occupied neighbors', () => {
            const start: Cube = { x: 0, y: 0, z: 0 };
            const occupied = new Set<string>();
            occupied.add(cubeKey({ x: 1, y: -1, z: 0 })); // Occupy E

            // Next is NE (+1, 0, -1)
            const result = findEmptyAdjacentCube(start, occupied);
            expect(result).toEqual({ x: 1, y: 0, z: -1 });
        });
    });
});
