import React from 'react';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../../store/launcherStore';

interface Option {
    value: string;
    label: string;
}

interface SettingsSelectProps {
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({
    label,
    value,
    options,
    onChange
}) => {
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';

    return (
        <div className="py-2">
            <label className={clsx("block text-sm font-medium mb-2", isCyberpunk ? "text-gray-200" : "text-white")}>
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={clsx(
                    "w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all",
                    isCyberpunk
                        ? "bg-black/50 border border-[#00f2ea]/30 text-[#00f2ea] focus:ring-[#00f2ea]/50"
                        : "bg-gray-700 border border-gray-600 text-white focus:ring-cyan-500"
                )}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};
