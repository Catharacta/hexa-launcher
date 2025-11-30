use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn set_always_on_top(app_handle: AppHandle, enable: bool) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window
            .set_always_on_top(enable)
            .map_err(|e| format!("Failed to set always on top: {}", e))?;
        println!("Set always on top: {}", enable);
    }
    Ok(())
}

#[tauri::command]
pub fn set_hide_on_blur(_app_handle: AppHandle, _enable: bool) -> Result<(), String> {
    // この機能はフロントエンドのイベントリスナーで実装
    // ここでは設定を保存するだけ（実際の保存はsettingsSliceで行われる）
    Ok(())
}
