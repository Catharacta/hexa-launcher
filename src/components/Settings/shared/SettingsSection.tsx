import React from 'react';
import { clsx } from 'clsx';
import { useLauncherStore } from '../../../store/launcherStore';

interface SettingsSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
    title,
    description,
    children,
    className,
    headerAction
}) => {
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';

    return (
        <div className={clsx(
            "p-5 rounded-lg border transition-all duration-300",
            isCyberpunk
                ? "bg-black/40 border-[#00f2ea]/30 shadow-[0_0_15px_rgba(0,242,234,0.05)]"
                : "bg-gray-800/80 border-gray-700",
            className
        )}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className={clsx(
                        "text-lg font-bold mb-1",
                        isCyberpunk ? "text-[#00f2ea] drop-shadow-[0_0_2px_rgba(0,242,234,0.5)]" : "text-white"
                    )}>
                        {title}
                    </h3>
                    {description && (
                        <p className="text-xs text-gray-400 max-w-xl">
                            {description}
                        </p>
                    )}
                </div>
                {headerAction && <div>{headerAction}</div>}
            </div>

            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
};
