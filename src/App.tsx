import { ScreenEffects } from './components/Effects/ScreenEffects';
import { useEffect, useState } from 'react';
import { HexGrid } from './components/HexGrid';
import { SearchBar } from './components/SearchBar';
import { SettingsModal } from './components/Settings/SettingsModal';
import { TreeModal } from './components/TreeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomCSSInjector } from './components/CustomCSSInjector';
import { ToastContainer } from './components/ToastContainer';
import { CellEditDialog } from './components/CellEditDialog';
import { UwpSelectorModal } from './components/Uwp/UwpSelectorModal';
import { loadSettings, startMouseEdgeMonitor, stopMouseEdgeMonitor } from './utils/tauri';
import { useLauncherStore } from './store/launcherStore';
import './i18n/config'; // Initialize i18n
import i18n from './i18n/config';

/**
 * アプリケーションのルートコンポーネント。
 *
 * 以下の役割を担います：
 * 1. スタートアップ時の設定ロード
 * 2. グローバルなイベントリスナーの設定（フォーカス、ショートカット、マウスエッジ）
 * 3. ウィンドウの表示・非表示アニメーションの管理
 * 4. 主要なUIモーダル（設定、編集、検索など）の配置
 * 5. エラー境界（ErrorBoundary）によるクラッシュガード
 */
function App() {
  // 必要なアクション・状態をストアから取得
  const loadFromSettings = useLauncherStore(state => state.loadFromSettings);
  const hideOnBlur = useLauncherStore(state => state.general?.windowBehavior?.hideOnBlur ?? false);
  const showOnMouseEdge = useLauncherStore(state => state.general?.windowBehavior?.showOnMouseEdge ?? false);

  /**
   * 初期化エフェクト：設定ファイル (settings.json) を読み込み、ストアに適用します。
   */
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

  /**
   * システムトレイからの設定画面オープンイベントを監視します。
   */
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
  const isExiting = useLauncherStore(state => state.isExiting);
  const setIsExiting = useLauncherStore(state => state.setIsExiting);
  const [animationClass, setAnimationClass] = useState('animate-window-show');

  /**
   * ウィンドウを閉じる際のアニメーションシーケンスを管理します。
   * CSSアニメーション完了後に実際にウィンドウを非表示にします。
   */
  useEffect(() => {
    if (isExiting) {
      setAnimationClass('animate-window-hide');
      const timer = setTimeout(async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().hide();
        setIsExiting(false);
        // アニメーションクラスは次の表示時まで維持（表示時にリセットされるため）
      }, 200); // 200ms matches CSS animation
      return () => clearTimeout(timer);
    }
  }, [isExiting, setIsExiting]);

  /**
   * ウィンドウのフォーカス変更を監視し、「フォーカス外れで隠す」設定の挙動を制御します。
   */
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();

      unlisten = await appWindow.onFocusChanged(({ payload: focused }) => {
        if (focused) {
          // フォーカス取得時: 表示アニメーション開始
          setIsExiting(false);
          setAnimationClass('animate-window-show');
        } else {
          // フォーカス喪失時: 設定が有効なら隠すプロセス開始
          if (hideOnBlur) {
            setIsExiting(true);
          }
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [hideOnBlur, setIsExiting]);

  /**
   * マウスが画面端に移動した際のウィンドウ表示モニターの設定を反映します。
   */
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

  /**
   * 言語設定の変更をi18nライブラリに適用します。
   */
  useEffect(() => {
    const language = useLauncherStore.getState()?.general?.language;
    if (language) i18n.changeLanguage(language);
  }, []);

  /**
   * アプリ起動時のホワイトフラッシュ防止のため、マウント後に少し遅れてウィンドウを表示します。
   */
  useEffect(() => {
    const showWindow = async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      // スタイル適用待ちのわずかな遅延
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
        className={`w-full h-screen relative overflow-hidden ${animationClass}`}
        style={{ backgroundColor: 'transparent' }}
      >
        <ScreenEffects />
        <HexGrid />

        {/* 各種モーダル - インタラクション有効 */}
        <SettingsModal />
        <UwpSelectorModal />
        <TreeModal />
        <CellEditDialog />

        <SearchBar />

        <ToastContainer />

      </div>
    </ErrorBoundary>
  );
}

export default App;