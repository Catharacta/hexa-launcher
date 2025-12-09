use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::System;
use tauri::{AppHandle, Emitter};

pub struct SystemMonitor {
    running: Arc<Mutex<bool>>,
}

impl SystemMonitor {
    pub fn new() -> Self {
        Self {
            running: Arc::new(Mutex::new(false)),
        }
    }

    pub fn start(&self, app_handle: AppHandle) {
        let running = self.running.clone();
        let mut run_lock = running.lock().unwrap();
        if *run_lock {
            return;
        }
        *run_lock = true;
        drop(run_lock);

        thread::spawn(move || {
            let mut sys = System::new_all();

            loop {
                {
                    let lock = running.lock().unwrap();
                    if !*lock {
                        break;
                    }
                }

                sys.refresh_cpu_all();
                sys.refresh_memory();

                let cpu_usage = sys.global_cpu_usage();
                let total_memory = sys.total_memory();
                let used_memory = sys.used_memory();

                // Avoid division by zero
                let memory_percentage = if total_memory > 0 {
                    (used_memory as f64 / total_memory as f64) * 100.0
                } else {
                    0.0
                };

                // Emit event
                let _ = app_handle.emit(
                    "system-stats",
                    serde_json::json!({
                        "cpu": cpu_usage,
                        "memory": memory_percentage,
                        "memory_used": used_memory,
                        "memory_total": total_memory
                    }),
                );

                thread::sleep(Duration::from_secs(1));
            }
        });
    }

    pub fn stop(&self) {
        let mut lock = self.running.lock().unwrap();
        *lock = false;
    }
}
