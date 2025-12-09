import React, { useState, useEffect } from 'react';
import { useLauncherStore } from '../../store/launcherStore';
import { clsx } from 'clsx';

export const ClockWidget: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours() % 12;

    const secondDeg = (seconds / 60) * 360;
    const minuteDeg = ((minutes + seconds / 60) / 60) * 360;
    const hourDeg = ((hours + minutes / 60) / 12) * 360;

    const themeColor = isCyberpunk ? '#00f2ea' : 'white';
    const secondaryColor = isCyberpunk ? '#ff003c' : '#ff4444'; // Red for second hand usually

    return (
        <div className="w-full h-full flex items-center justify-center p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Clock Face */}
                <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke={themeColor}
                    strokeWidth={isCyberpunk ? "2" : "3"}
                    className={clsx(isCyberpunk && "drop-shadow-[0_0_5px_rgba(0,242,234,0.5)]")}
                    opacity="0.8"
                />

                {/* Hour Markers */}
                {[...Array(12)].map((_, i) => (
                    <line
                        key={i}
                        x1="50" y1="10"
                        x2="50" y2={i % 3 === 0 ? "18" : "14"}
                        stroke={themeColor}
                        strokeWidth={i % 3 === 0 ? "2" : "1"}
                        transform={`rotate(${i * 30} 50 50)`}
                        opacity="0.6"
                    />
                ))}

                {/* Hour Hand */}
                <line
                    x1="50" y1="50"
                    x2="50" y2="25"
                    stroke={themeColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    transform={`rotate(${hourDeg} 50 50)`}
                    className="transition-transform duration-100 ease-linear"
                />

                {/* Minute Hand */}
                <line
                    x1="50" y1="50"
                    x2="50" y2="15"
                    stroke={themeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    transform={`rotate(${minuteDeg} 50 50)`}
                    className="transition-transform duration-100 ease-linear"
                />

                {/* Second Hand */}
                <line
                    x1="50" y1="50"
                    x2="50" y2="10"
                    stroke={secondaryColor}
                    strokeWidth="1"
                    strokeLinecap="round"
                    transform={`rotate(${secondDeg} 50 50)`}
                    opacity="0.9"
                />

                {/* Center Dot */}
                <circle cx="50" cy="50" r="2" fill={themeColor} />
            </svg>
        </div>
    );
};
