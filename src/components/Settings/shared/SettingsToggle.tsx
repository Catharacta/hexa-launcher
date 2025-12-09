import React from 'react';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../../store/launcherStore';

interface SettingsToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
    label,
    description,
    checked,
    onChange,
    disabled = false
}) => {
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';

    return (
        <div className={clsx("flex items-center justify-between py-1", disabled && "opacity-50 cursor-not-allowed")}>
            <div className="pr-4">
                <label className={clsx("block text-sm font-medium transition-colors", isCyberpunk ? "text-gray-200" : "text-white")}>
                    {label}
                </label>
                {description && (
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                )}
            </div>

            <button
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
                className={clsx(
                    "w-12 h-6 rounded-full relative transition-all duration-300 focus:outline-none",
                    checked
                        ? (isCyberpunk ? "bg-[#00f2ea]/20 shadow-[0_0_10px_rgba(0,242,234,0.4)] border border-[#00f2ea]/50" : "bg-cyan-600")
                        : "bg-gray-700 border border-gray-600"
                )}
            >
                <div className={clsx(
                    "w-4 h-4 rounded-full absolute top-1 transition-all duration-300 shadow-sm",
                    checked ? "left-7" : "left-1",
                    isCyberpunk
                        ? (checked ? "bg-[#00f2ea] shadow-[0_0_8px_#00f2ea]" : "bg-gray-500")
                        : "bg-white"
                )} />
            </button>
        </div>
    );
};
