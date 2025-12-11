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
    ///
    /// 新しいスレッドでマウス位置を0.1秒ごとにポーリングし、
    /// 画面の上端または左端にカーソルがある場合にウィンドウを表示します。
    /// マルチモニターに対応しており、カーソルがあるモニターにウィンドウを移動させます。
    pub fn start(&self, app_handle: AppHandle) {
        let running = Arc::clone(&self.running);

        // 二重起動防止
        if *running.lock().unwrap() {
            return;
        }
        *running.lock().unwrap() = true;

        thread::spawn(move || {
            #[cfg(target_os = "windows")]
            {
                while *running.lock().unwrap() {
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
                                    // エッジ検知のために少しバッファを持たせるロジックもここに記述
                                    let x_in_monitor = mouse_x >= m_pos.x
                                        && mouse_x < m_pos.x + m_size.width as i32;
                                    let y_in_monitor = mouse_y >= m_pos.y
                                        && mouse_y < m_pos.y + m_size.height as i32;

                                    if x_in_monitor && y_in_monitor {
                                        // このモニターの上端、または左端にあるか？
                                        let is_top_edge = (mouse_y - m_pos.y).abs() <= 5; // 5px閾値
                                        let is_left_edge = (mouse_x - m_pos.x).abs() <= 5;

                                        if is_top_edge || is_left_edge {
                                            if let Some(window) =
                                                app_handle.get_webview_window("main")
                                            {
                                                if !window.is_visible().unwrap_or(false) {
                                                    println!(
                                                        "Edge trigger on monitor at {:?}",
                                                        m_pos
                                                    );
                                                    // ウィンドウをカーソルのあるモニターへ移動
                                                    let _ = window.unmaximize();
                                                    let _ = window.set_size(tauri::Size::Physical(
                                                        tauri::PhysicalSize {
                                                            width: 800,
                                                            height: 600,
                                                        },
                                                    ));
                                                    let _ = window.set_position(
                                                        tauri::Position::Physical(m_pos.clone()),
                                                    );

                                                    let _ = window.show();
                                                    let _ = window.maximize();
                                                    let _ = window.set_focus();
                                                    // フォーカスを強制するためのワークアラウンド
                                                    let _ = window.set_always_on_top(true);
                                                    let _ = window.set_always_on_top(false);
                                                }
                                            }
                                        }
                                        break; // モニターが見つかったらループ終了
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
                // Placeholder for other OS
                thread::sleep(Duration::from_secs(1));
            }
        });
    }

    pub fn stop(&self) {
        *self.running.lock().unwrap() = false;
    }
}
