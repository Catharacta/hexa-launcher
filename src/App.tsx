import React, { useEffect, useState } from 'react';
import { HexGrid } from './components/HexGrid';
import { SettingsModal } from './components/Settings/SettingsModal';
import { TreeModal } from './components/TreeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { loadSettings } from './utils/tauri';
import { useLauncherStore } from './store/launcherStore';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const loadFromSettings = useLauncherStore(state => state.loadFromSettings);
  const cells = useLauncherStore(state => state.cells);
  const groups = useLauncherStore(state => state.groups);
  const opacity = useLauncherStore(state => state.appearance.opacity);

  // ------------------------------------------------------------
  // 設定を読み込む
  // React StrictMode で2回呼ばれても問題ないように、
  // マウントされているコンポーネントのみが結果を処理する。
  // ------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    loadSettings()
      .then(settings => {
        if (!mounted) return;
        if (settings) {
          loadFromSettings(settings);
        } else {
          console.log('No settings found, using initial state');
        }
        setIsLoaded(true);
      })
      .catch(err => {
        console.error('loadSettings failed', err);
        if (mounted) setIsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for open-settings event from system tray
  useEffect(() => {
    const setupListener = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      const unlisten = await listen('open-settings', () => {
        useLauncherStore.getState().setSettingsOpen(true);
      });
      return unlisten;
    };

    let unlistenPromise = setupListener();
    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  return (
    <ErrorBoundary>
      <div
        className="w-full h-screen relative transition-opacity duration-300"
        style={{ backgroundColor: `rgba(17, 24, 39, ${opacity ?? 0.9})` }}
      >
        <HexGrid />
        <SettingsModal />
        <TreeModal />
        <div className="absolute top-0 left-0 p-2 text-white text-xs pointer-events-none">
          Cells: {Object.keys(cells).length} | Groups: {Object.keys(groups).length} | Loaded:{' '}
          {isLoaded ? 'Yes' : 'No'}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;