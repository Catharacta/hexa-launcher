use std::path::PathBuf;
use tauri::AppHandle;

#[cfg(target_os = "windows")]
use winreg::{enums::*, RegKey};

#[tauri::command]
pub async fn set_startup(_app_handle: AppHandle, enable: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Get exe path on the main thread (Process context)
        let exe_path =
            std::env::current_exe().map_err(|e| format!("Failed to get exe path: {}", e))?;

        // Spawn blocking task for registry operations
        tauri::async_runtime::spawn_blocking(move || {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
            let (key, _disp) = hkcu
                .create_subkey(path)
                .map_err(|e| format!("Failed to open registry key: {}", e))?;

            let app_name = "HexaLauncher";

            if enable {
                key.set_value(app_name, &exe_path.to_string_lossy().as_ref())
                    .map_err(|e| format!("Failed to set registry value: {}", e))?;
                println!("Added startup entry via winreg");
            } else {
                let _ = key.delete_value(app_name); // Ignore error if not exists
                println!("Removed startup entry via winreg");
            }
            Ok(())
        })
        .await
        .map_err(|e| format!("Task join error: {}", e))?
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Startup is only supported on Windows".to_string())
    }
}

#[tauri::command]
pub async fn get_startup_status() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        // Spawn blocking task
        tauri::async_runtime::spawn_blocking(move || {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            let path = r"Software\Microsoft\Windows\CurrentVersion\Run";

            // Try to open key, if fails, it likely doesn't exist (false)
            let key = match hkcu.open_subkey(path) {
                Ok(k) => k,
                Err(_) => return Ok(false),
            };

            let app_name = "HexaLauncher";
            let val: Result<String, _> = key.get_value(app_name);

            Ok(val.is_ok())
        })
        .await
        .map_err(|e| format!("Task join error: {}", e))?
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}
