use std::path::Path;

#[tauri::command]
pub fn check_requires_admin(path: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        // Check if the executable requires admin privileges
        // This is a heuristic check - we look for common patterns
        let lower_path = path.to_lowercase();

        // Check if it's in system directories
        if lower_path.contains("\\windows\\")
            || lower_path.contains("\\program files\\")
            || lower_path.contains("\\system32\\")
        {
            return Ok(true);
        }

        // Check for common admin-requiring executables
        let filename = Path::new(&path)
            .file_name()
            .and_then(|f| f.to_str())
            .unwrap_or("")
            .to_lowercase();

        if filename.contains("setup")
            || filename.contains("install")
            || filename.contains("uninstall")
            || filename.contains("update")
        {
            return Ok(true);
        }

        // Default to false for user applications
        Ok(false)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[allow(dead_code)]
pub fn is_trusted_path(path: &str, trusted_paths: &[String]) -> bool {
    let path_obj = Path::new(path);

    for trusted in trusted_paths {
        let trusted_obj = Path::new(trusted);
        if path_obj.starts_with(trusted_obj) {
            return true;
        }
    }

    false
}
