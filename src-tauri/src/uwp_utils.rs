use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use std::process::Command;

const CREATE_NO_WINDOW: u32 = 0x08000000;

/// UWP(Universal Windows Platform)アプリの情報を表す構造体。
#[derive(Debug, Serialize, Deserialize)]
pub struct UwpApp {
    /// アプリケーションの表示名
    pub name: String,
    /// アプリケーションを一意に識別するID (Application User Model ID)。
    /// 起動時に使用されます。
    pub aumid: String,
}

/// PowerShellからの出力をパースするための中間構造体
#[derive(Deserialize)]
struct PsApp {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "AppID")]
    app_id: String,
}

/// PowerShellを使用して、インストールされているUWPアプリの一覧を取得します。
///
/// `Get-StartApps` コマンドレットを実行し、結果をJSONとしてパースします。
pub fn get_installed_uwp_apps() -> Result<Vec<UwpApp>, String> {
    // Get-StartApps returns an array of objects with Name and AppID
    let script = "Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Compress";

    let output = Command::new("powershell")
        .args(&["-NoProfile", "-Command", script])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    // PowerShellのConvertTo-Jsonは、結果が単数の場合はオブジェクト、複数の場合は配列を返します。
    // まず配列としてパースを試み、失敗した場合は単一オブジェクトとしてパースします。
    let apps: Vec<PsApp> = match serde_json::from_str::<Vec<PsApp>>(trimmed) {
        Ok(list) => list,
        Err(_) => {
            // 単一オブジェクトの場合のフォールバック
            match serde_json::from_str::<PsApp>(trimmed) {
                Ok(single) => vec![single],
                Err(e) => return Err(format!("Failed to parse JSON: {} | Output: {}", e, trimmed)),
            }
        }
    };

    Ok(apps
        .into_iter()
        .map(|a| UwpApp {
            name: a.name,
            aumid: a.app_id,
        })
        .collect())
}

/// 指定されたAUMIDを使用してUWPアプリを起動します。
///
/// `explorershell:AppsFolder\{AUMID}` を実行することで、通常のアプリと同様に起動できます。
pub fn launch_uwp(aumid: &str) -> Result<(), String> {
    // shell:AppsFolder\{AUMID} is the standard way to launch UWP apps from explorer
    let _ = Command::new("explorer")
        .arg(format!("shell:AppsFolder\\{}", aumid))
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| format!("Failed to spawn explorer: {}", e))?;

    Ok(())
}
