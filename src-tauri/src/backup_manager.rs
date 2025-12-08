use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use tauri::Manager;

pub fn create_backup(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let settings_path = app_dir.join("settings.json");
    if !settings_path.exists() {
        return Ok(()); // Nothing to backup
    }

    let backup_dir = app_dir.join("backups");
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
    }

    // Create backup filename with timestamp: settings_YYYYMMDD_HHMMSS.json
    let now = chrono::Local::now();
    let timestamp = now.format("%Y%m%d_%H%M%S").to_string();
    let backup_filename = format!("settings_{}.json", timestamp);
    let backup_path = backup_dir.join(backup_filename);

    // Copy file
    fs::copy(&settings_path, &backup_path).map_err(|e| e.to_string())?;

    // Prune old backups
    prune_backups(&backup_dir, 10)?;

    Ok(())
}

fn prune_backups(backup_dir: &Path, max_keep: usize) -> Result<(), String> {
    let mut entries = fs::read_dir(backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .map(|entry| entry.path())
        .filter(|path| path.is_file() && path.extension().map_or(false, |ext| ext == "json"))
        .collect::<Vec<PathBuf>>();

    // Sort by name (which includes timestamp, so chronological)
    entries.sort();

    if entries.len() > max_keep {
        let to_remove = entries.len() - max_keep;
        for path in entries.iter().take(to_remove) {
            let _ = fs::remove_file(path); // Ignore cleanup errors
        }
    }

    Ok(())
}
