use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

/// マウスが画面端に移動したことを検知するモニター構造体。
pub struct MouseEdgeMonitor {
    running: Arc<Mutex<bool>>,
}

impl MouseEdgeMonitor {
    pub fn new() -> Self {
        Self {
            running: Arc::new(Mutex::new(false)),
        }
    }

    /// 監視を開始します。
    pub fn start(&self, app_handle: AppHandle) {
        let running = Arc::clone(&self.running);

        // 二重起動防止
        if let Ok(mut guard) = running.lock() {
            if *guard {
                return;
            }
            *guard = true;
        } else {
            return;
        }

        thread::spawn(move || {
            #[cfg(target_os = "windows")]
            {
                loop {
                    // Check running state safely
                    if let Ok(guard) = running.lock() {
                        if !*guard {
                            break;
                        }
                    } else {
                        break; // Poisoned
                    }

                    unsafe {
                        let mut point = std::mem::zeroed();
                        if GetCursorPos(&mut point).is_ok() {
                            let mouse_x = point.x;
                            let mouse_y = point.y;

                            // 全てのモニターをチェック
                            if let Ok(monitors) = app_handle.available_monitors() {
                                for monitor in monitors {
                                    let m_pos = monitor.position(); // PhysicalPosition
                                    let m_size = monitor.size(); // PhysicalSize

                                    // カーソルがこのモニター内にあるか確認
                                    let x_in_monitor = mouse_x >= m_pos.x
                                        && mouse_x < m_pos.x + m_size.width as i32;
                                    let y_in_monitor = mouse_y >= m_pos.y
                                        && mouse_y < m_pos.y + m_size.height as i32;

                                    if x_in_monitor && y_in_monitor {
                                        // このモニターの上端、または左端にあるか？
                                        let is_top_edge = (mouse_y - m_pos.y).abs() <= 5; // 閾値を5pxに厳格化
                                        let is_left_edge = (mouse_x - m_pos.x).abs() <= 5;

                                        if is_top_edge || is_left_edge {
                                            MouseEdgeMonitor::try_trigger_window(
                                                &app_handle,
                                                &monitor,
                                            );
                                            // 反応後は少し待つ（連続反応防止）
                                            thread::sleep(Duration::from_millis(1000));
                                        }
                                        break; // Monitor found, stop checking others
                                    }
                                }
                            }
                        }
                    }
                    thread::sleep(Duration::from_millis(100));
                }
            }

            #[cfg(not(target_os = "windows"))]
            {
                thread::sleep(Duration::from_secs(1));
            }
        });
    }

    /// ウィンドウを表示・移動させる処理（失敗してもパニックしない）
    fn try_trigger_window(app_handle: &AppHandle, target_monitor: &tauri::Monitor) {
        if let Some(window) = app_handle.get_webview_window("main") {
            let is_visible = window.is_visible().unwrap_or(false);
            let is_focused = window.is_focused().unwrap_or(false);

            // 既に表示され、フォーカスがある場合は何もしない（作業を邪魔しない）
            if is_visible && is_focused {
                return;
            }

            println!(
                "DEBUG: Edge detected. Triggering window. Vis:{}, Foc:{}",
                is_visible, is_focused
            );

            // 1. 最小化解除
            if window.is_minimized().unwrap_or(false) {
                let _ = window.unminimize();
            }

            // 2. モニター移動判定
            // 現在のウィンドウ位置を取得し、ターゲットモニターとずれていれば移動
            // ※ウィンドウが最大化されていると位置取得や移動が正確でない場合があるため、
            //   安全のため一度 unmaximize するのが確実
            let _ = window.unmaximize();

            // 移動 (エラー無視)
            let _ =
                window.set_position(tauri::Position::Physical(target_monitor.position().clone()));

            // 3. 表示 & 最大化
            let _ = window.show();
            let _ = window.maximize();

            // 4. フォーカス奪取 (Always On Top トリック)
            let _ = window.set_always_on_top(true);
            let _ = window.set_focus();
            let _ = window.set_always_on_top(false);
        }
    }

    pub fn stop(&self) {
        if let Ok(mut guard) = self.running.lock() {
            *guard = false;
        }
    }
}
