import { useEffect } from 'react';
import { HexGrid } from './components/HexGrid';
import { SearchBar } from './components/SearchBar';
import { SettingsModal } from './components/Settings/SettingsModal';
import { TreeModal } from './components/TreeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomCSSInjector } from './components/CustomCSSInjector';
import { ToastContainer } from './components/ToastContainer';
import { CellEditDialog } from './components/CellEditDialog';
import { loadSettings, hideWindow, startMouseEdgeMonitor, stopMouseEdgeMonitor } from './utils/tauri';
import { useLauncherStore } from './store/launcherStore';
import './i18n/config'; // Initialize i18n
import i18n from './i18n/config';

function App() {
  // 必要なアクション・状態をストアから取得
  const loadFromSettings = useLauncherStore(state => state.loadFromSettings);
  const hideOnBlur = useLauncherStore(state => state.general?.windowBehavior?.hideOnBlur ?? false);
  const showOnMouseEdge = useLauncherStore(state => state.general?.windowBehavior?.showOnMouseEdge ?? false);

  useEffect(() => {
    loadSettings()
      .then(settings => {
        if (settings) {
          loadFromSettings(settings);
        } else {
          console.log('No settings found, using initial state');
        }
      })
      .catch(err => {
        console.error('loadSettings failed', err);
      });
  }, [loadFromSettings]);

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
      unlistenPromise.then(unlisten => unlisten && unlisten());
    };
  }, []);

  // Hide on Blur（設定フラグが true の時のみ）
  useEffect(() => {
    if (!hideOnBlur) return;

    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();

      unlisten = await appWindow.onFocusChanged(({ payload: focused }) => {
        if (!focused) {
          hideWindow().catch(console.error);
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [hideOnBlur]);

  // Show on Mouse Edge
  useEffect(() => {
    if (showOnMouseEdge) {
      startMouseEdgeMonitor().catch(console.error);
    } else {
      stopMouseEdgeMonitor().catch(console.error);
    }

    return () => {
      stopMouseEdgeMonitor().catch(console.error);
    };
  }, [showOnMouseEdge]);

  // 言語設定の適用
  useEffect(() => {
    const language = useLauncherStore.getState()?.general?.language;
    if (language) i18n.changeLanguage(language);
  }, []);

  // Show window gracefully after mount to prevent white flash
  useEffect(() => {
    const showWindow = async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      // Small delay to ensure styles are applied
      setTimeout(async () => {
        await getCurrentWindow().show();
        await getCurrentWindow().setFocus();
      }, 100);
    };
    showWindow();
  }, []);

  return (
    <ErrorBoundary>
      <CustomCSSInjector />
      <div
        className="w-full h-screen relative transition-opacity duration-300"
        style={{ backgroundColor: 'transparent' }}
      >
        <HexGrid />
        <SearchBar />
        <SettingsModal />
        <TreeModal />
        <CellEditDialog />
        <ToastContainer />

      </div>
    </ErrorBoundary>
  );
}

export default App;