export interface ThemeDefinition {
    name: string;
    label: string;
    color: string; // Hex color for UI elements like buttons
    stroke: string; // Tailwind class for SVG stroke
    text: string; // Tailwind class for text color
    textLight: string; // Tailwind class for lighter text color
}

export const THEMES: Record<string, ThemeDefinition> = {
    cyan: {
        name: 'cyan',
        label: 'Cyan',
        color: '#06b6d4',
        stroke: "stroke-cyan-500 hover:stroke-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]",
        text: "text-cyan-400",
        textLight: "text-cyan-100"
    },
    blue: {
        name: 'blue',
        label: 'Blue',
        color: '#3b82f6',
        stroke: "stroke-blue-500 hover:stroke-blue-400 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
        text: "text-blue-400",
        textLight: "text-blue-100"
    },
    purple: {
        name: 'purple',
        label: 'Purple',
        color: '#a855f7',
        stroke: "stroke-purple-500 hover:stroke-purple-400 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]",
        text: "text-purple-400",
        textLight: "text-purple-100"
    },
    green: {
        name: 'green',
        label: 'Green',
        color: '#22c55e',
        stroke: "stroke-green-500 hover:stroke-green-400 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
        text: "text-green-400",
        textLight: "text-green-100"
    },
    orange: {
        name: 'orange',
        label: 'Orange',
        color: '#f97316',
        stroke: "stroke-orange-500 hover:stroke-orange-400 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]",
        text: "text-orange-400",
        textLight: "text-orange-100"
    },
    red: {
        name: 'red',
        label: 'Red',
        color: '#ef4444',
        stroke: "stroke-red-500 hover:stroke-red-400 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",
        text: "text-red-400",
        textLight: "text-red-100"
    }
};

export type ThemeColor = keyof typeof THEMES;
