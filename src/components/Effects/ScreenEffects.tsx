import React from 'react';
import { useLauncherStore } from '../../store/launcherStore';
import { CRTOverlay } from './CRTOverlay';
import { ParticleBackground } from './ParticleBackground';

export const ScreenEffects: React.FC = () => {
    const { enableVFX, style } = useLauncherStore(state => state.appearance);

    if (!enableVFX) return null;

    return (
        <>
            <ParticleBackground />

            {/* Minimal effects for default theme, heavy for cyberpunk */}
            {style === 'cyberpunk' && <CRTOverlay />}
        </>
    );
};
