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
                            // Check if cursor is at screen edge (top or left)
                            // Adjust threshold as needed
                            if point.x <= 0 || point.y <= 0 {
                                if let Some(window) = app_handle.get_webview_window("main") {
                                    // Only show if not visible to avoid constant focus stealing
                                    if !window.is_visible().unwrap_or(false) {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                        let _ = window.set_always_on_top(true);
                                        let _ = window.set_always_on_top(false);
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
