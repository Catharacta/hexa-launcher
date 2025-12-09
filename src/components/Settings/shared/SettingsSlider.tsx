import React from 'react';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../../store/launcherStore';

interface SettingsSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
}

export const SettingsSlider: React.FC<SettingsSliderProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    unit = '',
    onChange
}) => {
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';

    return (
        <div className="py-2">
            <div className="flex justify-between mb-2">
                <label className={clsx("text-sm font-medium", isCyberpunk ? "text-gray-200" : "text-white")}>
                    {label}
                </label>
                <span className={clsx("text-sm font-mono", isCyberpunk ? "text-[#00f2ea]" : "text-cyan-400")}>
                    {value}{unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className={clsx(
                    "w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700",
                    isCyberpunk ? "accent-[#00f2ea]" : "accent-cyan-500"
                )}
            />
        </div>
    );
};
