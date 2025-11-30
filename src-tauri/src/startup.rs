use std::process::Command;
use tauri::AppHandle;

#[tauri::command]
pub fn set_startup(_app_handle: AppHandle, enable: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let exe_path =
            std::env::current_exe().map_err(|e| format!("Failed to get exe path: {}", e))?;

        let app_name = "HexaLauncher";
        let reg_key = r"Software\Microsoft\Windows\CurrentVersion\Run";

        if enable {
            // レジストリに追加
            let output = Command::new("reg")
                .args(&[
                    "add",
                    &format!("HKCU\\{}", reg_key),
                    "/v",
                    app_name,
                    "/t",
                    "REG_SZ",
                    "/d",
                    &format!("\"{}\"", exe_path.display()),
                    "/f",
                ])
                .output()
                .map_err(|e| format!("Failed to execute reg command: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("Failed to add startup entry: {}", stderr));
            }

            println!("Added startup entry for {}", app_name);
        } else {
            // レジストリから削除
            let output = Command::new("reg")
                .args(&[
                    "delete",
                    &format!("HKCU\\{}", reg_key),
                    "/v",
                    app_name,
                    "/f",
                ])
                .output()
                .map_err(|e| format!("Failed to execute reg command: {}", e))?;

            if !output.status.success() {
                // エントリが存在しない場合もエラーになるが、これは許容
                println!("Startup entry may not exist or already removed");
            } else {
                println!("Removed startup entry for {}", app_name);
            }
        }

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Startup is only supported on Windows".to_string())
    }
}

#[tauri::command]
pub fn get_startup_status() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let app_name = "HexaLauncher";
        let reg_key = r"Software\Microsoft\Windows\CurrentVersion\Run";

        let output = Command::new("reg")
            .args(&["query", &format!("HKCU\\{}", reg_key), "/v", app_name])
            .output()
            .map_err(|e| format!("Failed to execute reg command: {}", e))?;

        // レジストリエントリが存在すればtrueを返す
        Ok(output.status.success())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}
