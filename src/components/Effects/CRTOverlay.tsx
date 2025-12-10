import React from 'react';
import { useLauncherStore } from '../../store/launcherStore';

export const CRTOverlay: React.FC = () => {
    const intensity = useLauncherStore(state => state.appearance.vfxIntensity ?? 0.5);

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            {/* Scanlines */}
            <div
                className="absolute inset-0 bg-scanlines opacity-20"
                style={{ opacity: 0.1 + (intensity * 0.2) }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0 bg-vignette"
                style={{ opacity: 0.2 + (intensity * 0.3) }}
            />

            {/* RGB Shift / Chromatic Aberration Container */}
            <div className="absolute inset-0 animate-glitch-occasional mix-blend-screen opacity-50">
                {/* This would ideally clone the screen content, but for a simple overlay 
                    we simulate it with noise or color washes */}
            </div>

            <style>{`
                .bg-scanlines {
                    background: linear-gradient(
                        to bottom,
                        rgba(255,255,255,0),
                        rgba(255,255,255,0) 50%,
                        rgba(0,0,0,0.2) 50%,
                        rgba(0,0,0,0.2)
                    );
                    background-size: 100% 4px;
                }
                .bg-vignette {
                    background: radial-gradient(
                        circle,
                        rgba(0,0,0,0) 60%,
                        rgba(0,0,0,0.4) 100%
                    );
                }
                .animate-glitch-occasional {
                    animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
                }
                @keyframes glitch-anim-1 {
                    0% { transform: translate(0); opacity: 0; }
                    
                    /* Glitch Event 1 */
                    20% { transform: translate(0); opacity: 0; }
                    21% { transform: translate(-4px, 4px); opacity: 0.3; background-color: rgba(255, 0, 60, 0.1); }
                    22% { transform: translate(4px, -4px); opacity: 0.3; background-color: rgba(0, 242, 234, 0.1); }
                    23% { transform: translate(0); opacity: 0; }

                    /* Glitch Event 2 */
                    55% { transform: translate(0); opacity: 0; }
                    56% { transform: translate(5px, 0); opacity: 0.4; filter: invert(0.2); }
                    57% { transform: translate(-5px, 0); opacity: 0; }

                    /* Glitch Event 3 (Subtle shake) */
                    80% { transform: translate(1px, 1px); opacity: 0.1; }
                    81% { transform: translate(-1px, -1px); opacity: 0.1; }
                    82% { transform: translate(0); opacity: 0; }
                    
                    100% { transform: translate(0); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
