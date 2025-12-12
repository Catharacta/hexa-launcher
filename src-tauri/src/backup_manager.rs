use std::fs;
use std::path::{Path, PathBuf};

use tauri::Manager;

/// 現在の設定ファイル(`settings.json`)のバックアップを作成します。
///
/// タイムスタンプ付きのファイル名(`settings_YYYYMMDD_HHMMSS.json`)でコピーを作成し、
/// 古いバックアップを自動的に削除（ローテーション）します。
///
/// # 引数
/// * `app_handle` - TauriのAppHandle
pub fn create_backup(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let settings_path = app_dir.join("settings.json");
    if !settings_path.exists() {
        return Ok(()); // バックアップ対象がない場合
    }

    let backup_dir = app_dir.join("backups");
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
    }

    // タイムスタンプ付きバックアップファイル名の作成: settings_YYYYMMDD_HHMMSS.json
    let now = chrono::Local::now();
    let timestamp = now.format("%Y%m%d_%H%M%S").to_string();
    let backup_filename = format!("settings_{}.json", timestamp);
    let backup_path = backup_dir.join(backup_filename);

    // ファイルコピー
    fs::copy(&settings_path, &backup_path).map_err(|e| e.to_string())?;

    // 古いバックアップの削除 (最新10件を保持)
    prune_backups(&backup_dir, 10)?;

    Ok(())
}

/// 指定された数の最新バックアップを保持し、それ以外を削除します。
///
/// # 引数
/// * `backup_dir` - バックアップディレクトリのパス
/// * `max_keep` - 保持する最大ファイル数
fn prune_backups(backup_dir: &Path, max_keep: usize) -> Result<(), String> {
    let mut entries = fs::read_dir(backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .map(|entry| entry.path())
        .filter(|path| path.is_file() && path.extension().map_or(false, |ext| ext == "json"))
        .collect::<Vec<PathBuf>>();

    // 名前順でソート（タイムスタンプが含まれるため、実質的に時系列順になる）
    entries.sort();

    // 保持件数を超えている場合、古いものから削除
    if entries.len() > max_keep {
        let to_remove = entries.len() - max_keep;
        for path in entries.iter().take(to_remove) {
            let _ = fs::remove_file(path); // 削除エラーは無視して続行
        }
    }

    Ok(())
}
