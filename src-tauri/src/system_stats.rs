use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::System;
use tauri::{AppHandle, Emitter};

/// システムモニタリング機能を提供する構造体。
/// CPU使用率とメモリ使用状況を定期的に取得し、フロントエンドにイベントを発行します。
pub struct SystemMonitor {
    /// 監視スレッドが実行中かどうかを管理するフラグ。
    /// スレッドセーフにするために Arc<Mutex<bool>> でラップしています。
    running: Arc<Mutex<bool>>,
}

impl SystemMonitor {
    /// SystemMonitorの新しいインスタンスを作成します。
    pub fn new() -> Self {
        Self {
            running: Arc::new(Mutex::new(false)),
        }
    }

    /// 監視を開始します。
    ///
    /// # 引数
    /// * `app_handle` - TauriのAppHandle。イベント発行に使用します。
    ///
    /// 既に実行中の場合は何もしません。新しいスレッドを立ち上げ、
    /// 1秒ごとにシステム情報を取得して `system-stats` イベントを発行します。
    pub fn start(&self, app_handle: AppHandle) {
        let running = self.running.clone();
        let mut run_lock = running.lock().unwrap();
        if *run_lock {
            return;
        }
        *run_lock = true;
        drop(run_lock);

        thread::spawn(move || {
            // sysinfoのSystemオブジェクトを初期化
            let mut sys = System::new_all();

            loop {
                // 実行フラグを確認
                {
                    let lock = running.lock().unwrap();
                    if !*lock {
                        break;
                    }
                }

                // CPUとメモリ情報を更新
                sys.refresh_cpu_all();
                sys.refresh_memory();

                let cpu_usage = sys.global_cpu_usage();
                let total_memory = sys.total_memory();
                let used_memory = sys.used_memory();

                // メモリ使用率を計算（ゼロ除算防止）
                let memory_percentage = if total_memory > 0 {
                    (used_memory as f64 / total_memory as f64) * 100.0
                } else {
                    0.0
                };

                // フロントエンドにイベントを発行
                let _ = app_handle.emit(
                    "system-stats",
                    serde_json::json!({
                        "cpu": cpu_usage,
                        "memory": memory_percentage,
                        "memory_used": used_memory,
                        "memory_total": total_memory
                    }),
                );

                // 1秒待機
                thread::sleep(Duration::from_secs(1));
            }
        });
    }

    /// 監視を停止します。
    /// 実行フラグをfalseに設定し、監視スレッドをループから抜けさせて終了させます。
    pub fn stop(&self) {
        let mut lock = self.running.lock().unwrap();
        *lock = false;
    }
}
