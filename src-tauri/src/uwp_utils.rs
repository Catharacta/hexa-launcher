use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use std::process::Command;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Serialize, Deserialize)]
pub struct UwpApp {
    pub name: String,
    pub aumid: String,
}

#[derive(Deserialize)]
struct PsApp {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "AppID")]
    app_id: String,
}

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

    // PowerShell's ConvertTo-Json can return a single object OR an array.
    // We try parsing as Vec first. If that fails, try single object.
    let apps: Vec<PsApp> = match serde_json::from_str::<Vec<PsApp>>(trimmed) {
        Ok(list) => list,
        Err(_) => {
            // Try single object
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

pub fn launch_uwp(aumid: &str) -> Result<(), String> {
    // shell:AppsFolder\{AUMID} is the standard way to launch UWP apps from explorer
    let _ = Command::new("explorer")
        .arg(format!("shell:AppsFolder\\{}", aumid))
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| format!("Failed to spawn explorer: {}", e))?;

    Ok(())
}
