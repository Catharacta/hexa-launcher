import { useEffect } from 'react';
import { useLauncherStore } from '../store/launcherStore';

export const CustomCSSInjector: React.FC = () => {
    const customCSS = useLauncherStore(state => state.advanced.customCSS);

    useEffect(() => {
        const styleId = 'custom-css-injector';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = customCSS;

        return () => {
            // Don't remove on unmount, only update
        };
    }, [customCSS]);

    return null;
};
