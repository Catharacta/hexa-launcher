use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

pub struct MouseEdgeMonitor {
    running: Arc<Mutex<bool>>,
}

impl MouseEdgeMonitor {
    pub fn new() -> Self {
        Self {
            running: Arc::new(Mutex::new(false)),
        }
    }

    pub fn start(&self, app_handle: AppHandle) {
        let running = Arc::clone(&self.running);

        // Prevent multiple threads
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

                            // Check all monitors
                            if let Ok(monitors) = app_handle.available_monitors() {
                                for monitor in monitors {
                                    let m_pos = monitor.position(); // PhysicalPosition
                                    let m_size = monitor.size(); // PhysicalSize

                                    // Check if cursor is within this monitor's X range
                                    // We add a buffer for edge detection
                                    let x_in_monitor = mouse_x >= m_pos.x
                                        && mouse_x < m_pos.x + m_size.width as i32;
                                    let y_in_monitor = mouse_y >= m_pos.y
                                        && mouse_y < m_pos.y + m_size.height as i32;

                                    if x_in_monitor && y_in_monitor {
                                        // Check for Top Edge OR Left Edge of THIS monitor
                                        let is_top_edge = (mouse_y - m_pos.y).abs() <= 2; // pixel threshold
                                        let is_left_edge = (mouse_x - m_pos.x).abs() <= 2;

                                        if is_top_edge || is_left_edge {
                                            if let Some(window) =
                                                app_handle.get_webview_window("main")
                                            {
                                                if !window.is_visible().unwrap_or(false) {
                                                    // Move window to this monitor
                                                    let _ = window.set_position(
                                                        tauri::Position::Physical(m_pos.clone()),
                                                    );

                                                    let _ = window.show();
                                                    let _ = window.set_focus();
                                                    let _ = window.set_always_on_top(true);
                                                    let _ = window.set_always_on_top(false);
                                                }
                                            }
                                        }
                                        break; // Found the monitor cursor is on
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
