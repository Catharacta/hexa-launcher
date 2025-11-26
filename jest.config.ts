// jest.config.ts
import type { Config } from 'jest';
const config: Config = {
    // *.test.tsx / *.spec.tsx を対象
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    // TypeScript 用の preset
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    // Vite のエイリアスがあればここでマッピング（例: @/components → src/components）
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // ts/tsx を ts-jest が変換
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    // jest-dom のマッチャーを自動で読み込む
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
export default config;