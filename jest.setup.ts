// jest.setup.ts
import '@testing-library/jest-dom';

// Mock Tauri API
global.window = Object.create(window);
const mockTauri = {
    invoke: jest.fn(),
    event: {
        listen: jest.fn(),
    },
};

Object.defineProperty(window, '__TAURI__', {
    writable: true,
    value: mockTauri,
});

// Mock Tauri modules
jest.mock('@tauri-apps/api/core', () => ({
    invoke: jest.fn(),
}));

jest.mock('@tauri-apps/api/event', () => ({
    listen: jest.fn(() => Promise.resolve(() => { })),
}));

jest.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: jest.fn(() => ({
        onFocusChanged: jest.fn(() => Promise.resolve(() => { })),
        isVisible: jest.fn(() => Promise.resolve(true)),
        show: jest.fn(() => Promise.resolve()),
        hide: jest.fn(() => Promise.resolve()),
        setFocus: jest.fn(() => Promise.resolve()),
        setAlwaysOnTop: jest.fn(() => Promise.resolve()),
        unminimize: jest.fn(() => Promise.resolve()),
    })),
}));

jest.mock('@tauri-apps/plugin-dialog', () => ({
    open: jest.fn(() => Promise.resolve(null)),
}));