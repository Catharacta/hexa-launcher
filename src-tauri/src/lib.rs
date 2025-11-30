use std::fs;
use std::str::FromStr;
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

mod startup;
mod window_behavior;

#[tauri::command]
fn save_settings(app_handle: tauri::AppHandle, settings: String) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }
    let path = app_dir.join("settings.json");
    // Atomic write: write to temp, then rename
    let temp_path = app_dir.join("settings.json.tmp");
    fs::write(&temp_path, settings).map_err(|e| e.to_string())?;
    fs::rename(&temp_path, &path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_settings(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let path = app_dir.join("settings.json");
    if !path.exists() {
        return Ok("{}".to_string()); // Return empty JSON object or default
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn launch_app(
    _app_handle: tauri::AppHandle,
    path: String,
    args: Option<String>,
    working_dir: Option<String>,
) -> Result<(), String> {
    // If it's an executable, try to spawn it directly to support args and working dir
    // Simple heuristic: ends with .exe or .bat or .cmd
    let lower_path = path.to_lowercase();
    if lower_path.ends_with(".exe") || lower_path.ends_with(".bat") || lower_path.ends_with(".cmd")
    {
        let mut cmd = std::process::Command::new(&path);
        if let Some(a) = args {
            cmd.args(a.split_whitespace());
        }
        if let Some(wd) = working_dir {
            cmd.current_dir(wd);
        }
        match cmd.spawn() {
            Ok(_) => return Ok(()),
            Err(e) => {
                // Fallback to open if spawn fails (e.g. permission issue or not actually executable)
                println!("Spawn failed, falling back to open: {}", e);
            }
        }
    }

    // Fallback to using the 'opener' plugin or shell open
    #[cfg(target_os = "windows")]
    {
        let mut cmd = std::process::Command::new("explorer");
        cmd.arg(path);
        cmd.spawn().map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Fallback for other OS (not primary target but good practice)
        let _ = std::process::Command::new("open").arg(path).spawn();
    }

    Ok(())
}

#[tauri::command]
fn resolve_shortcut(path: String) -> Result<String, String> {
    // Use PowerShell to resolve the shortcut target
    let output = std::process::Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-Command",
            &format!(
                "(New-Object -ComObject WScript.Shell).CreateShortcut('{}').TargetPath",
                path
            ),
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let target = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if target.is_empty() {
        return Err("Could not resolve shortcut target".to_string());
    }
    Ok(target)
}

use base64::Engine;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use windows::Win32::Graphics::Gdi::{
    CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits, GetObjectW, ReleaseDC,
    SelectObject, BITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HBITMAP,
};
use windows::Win32::Storage::FileSystem::FILE_ATTRIBUTE_NORMAL;
use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON};
use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, HICON};

#[tauri::command]
fn get_file_icon(path: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            let wide_path: Vec<u16> = OsStr::new(&path)
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();

            let mut shfi: SHFILEINFOW = std::mem::zeroed();
            let result = SHGetFileInfoW(
                windows::core::PCWSTR(wide_path.as_ptr()),
                FILE_ATTRIBUTE_NORMAL,
                Some(&mut shfi),
                std::mem::size_of::<SHFILEINFOW>() as u32,
                SHGFI_ICON | SHGFI_LARGEICON,
            );

            if result == 0 {
                return Err(format!("Failed to get file info for {}", path));
            }

            let hicon = shfi.hIcon;
            if hicon.is_invalid() {
                return Err("Invalid icon handle".to_string());
            }

            // Convert HICON to PNG bytes
            let png_data = icon_to_png(hicon).map_err(|e| {
                let _ = DestroyIcon(hicon);
                e
            })?;

            let _ = DestroyIcon(hicon);

            let base64_string = base64::engine::general_purpose::STANDARD.encode(&png_data);
            Ok(format!("data:image/png;base64,{}", base64_string))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Icon extraction is only supported on Windows".to_string())
    }
}

#[cfg(target_os = "windows")]
unsafe fn icon_to_png(hicon: HICON) -> Result<Vec<u8>, String> {
    let mut icon_info = std::mem::zeroed();
    if GetIconInfo(hicon, &mut icon_info).is_err() {
        return Err("Failed to get icon info".to_string());
    }

    let hbitmap = icon_info.hbmColor;
    let _hbm_mask = icon_info.hbmMask; // We need to delete this later

    // Ensure we clean up GDI objects
    struct GdiObject<T: Copy>(T, fn(T));
    impl<T: Copy> Drop for GdiObject<T> {
        fn drop(&mut self) {
            (self.1)(self.0);
        }
    }

    // Helper to delete bitmap
    fn delete_bitmap(h: HBITMAP) {
        unsafe {
            let _ = DeleteObject(h);
        }
    }
    let _cleanup_color = GdiObject(hbitmap, delete_bitmap);
    let _cleanup_mask = GdiObject(icon_info.hbmMask, delete_bitmap);

    if hbitmap.is_invalid() {
        return Err("Invalid color bitmap".to_string());
    }

    let hdc_screen = GetDC(None);
    let hdc_mem = CreateCompatibleDC(hdc_screen);
    let _cleanup_dc = GdiObject(hdc_mem, |h| unsafe {
        let _ = DeleteDC(h);
    });
    let _cleanup_screen_dc = GdiObject(hdc_screen, |h| unsafe {
        let _ = ReleaseDC(None, h);
    });

    let old_obj = SelectObject(hdc_mem, hbitmap);

    let mut bitmap: BITMAP = std::mem::zeroed();
    if GetObjectW(
        windows::Win32::Graphics::Gdi::HGDIOBJ(hbitmap.0),
        std::mem::size_of::<BITMAP>() as i32,
        Some(&mut bitmap as *mut _ as *mut _),
    ) == 0
    {
        return Err("Failed to get bitmap object".to_string());
    }

    let width = bitmap.bmWidth;
    let height = bitmap.bmHeight;
    let size = (width * height * 4) as usize;
    let mut pixels = vec![0u8; size];

    let mut bi: BITMAPINFO = std::mem::zeroed();
    bi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
    bi.bmiHeader.biWidth = width;
    bi.bmiHeader.biHeight = -height; // Top-down
    bi.bmiHeader.biPlanes = 1;
    bi.bmiHeader.biBitCount = 32;
    bi.bmiHeader.biCompression = BI_RGB.0;

    if GetDIBits(
        hdc_mem,
        hbitmap,
        0,
        height as u32,
        Some(pixels.as_mut_ptr() as *mut _),
        &mut bi,
        DIB_RGB_COLORS,
    ) == 0
    {
        return Err("Failed to get DIB bits".to_string());
    }

    // Restore old object before deleting DC (handled by drop)
    SelectObject(hdc_mem, old_obj);

    // Convert BGRA to RGBA
    for chunk in pixels.chunks_mut(4) {
        let b = chunk[0];
        let r = chunk[2];
        chunk[0] = r;
        chunk[2] = b;
    }

    // Encode to PNG using image crate
    let mut png_buffer = Vec::new();
    let img_buffer: image::ImageBuffer<image::Rgba<u8>, _> =
        image::ImageBuffer::from_raw(width as u32, height as u32, pixels)
            .ok_or("Failed to create image buffer")?;

    img_buffer
        .write_to(
            &mut std::io::Cursor::new(&mut png_buffer),
            image::ImageOutputFormat::Png,
        )
        .map_err(|e| e.to_string())?;

    Ok(png_buffer)
}

#[tauri::command]
fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_global_shortcut(app_handle: tauri::AppHandle, shortcut: String) -> Result<(), String> {
    println!("Updating global shortcut to: {}", shortcut);
    let _ = app_handle.global_shortcut().unregister_all();
    let shortcut_obj = Shortcut::from_str(&shortcut).map_err(|e| e.to_string())?;
    app_handle
        .global_shortcut()
        .register(shortcut_obj)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn save_dropped_file(
    app_handle: tauri::AppHandle,
    name: String,
    content: Vec<u8>,
) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let dropped_files_dir = app_dir.join("dropped_files");
    if !dropped_files_dir.exists() {
        fs::create_dir_all(&dropped_files_dir).map_err(|e| e.to_string())?;
    }

    let file_path = dropped_files_dir.join(&name);
    fs::write(&file_path, content).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

// Persistence commands for export/import functionality
#[tauri::command]
fn export_settings_json(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let path = app_dir.join("settings.json");
    if !path.exists() {
        return Ok("{}".to_string());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_settings_to_file(file_path: String, data: String) -> Result<(), String> {
    fs::write(&file_path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_settings_from_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::TrayIconBuilder;
    use tauri::{Emitter, Manager};
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_settings,
            load_settings,
            launch_app,
            resolve_shortcut,
            get_file_icon,
            hide_window,
            update_global_shortcut,
            save_dropped_file,
            export_settings_json,
            save_settings_to_file,
            load_settings_from_file,
            startup::set_startup,
            startup::get_startup_status,
            window_behavior::set_always_on_top,
            window_behavior::set_hide_on_blur,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(|app, _shortcut, event| {
                            if event.state == ShortcutState::Pressed {
                                if let Some(window) = app.get_webview_window("main") {
                                    match window.is_visible() {
                                        Ok(true) => {
                                            let _ = window.hide();
                                        }
                                        Ok(false) => {
                                            let _ = window.show();
                                            let _ = window.set_focus();
                                            // Force focus workaround
                                            let _ = window.set_always_on_top(true);
                                            let _ = window.set_always_on_top(false);
                                        }
                                        Err(e) => {
                                            eprintln!("Failed to check window visibility: {}", e);
                                        }
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                // Register default shortcut
                let _ = app.handle().global_shortcut().register("Alt+Space");

                // File drop event handler
                let app_handle = app.handle().clone();
                if let Some(window) = app.get_webview_window("main") {
                    window.on_window_event(move |event| {
                        if let tauri::WindowEvent::DragDrop(drop_event) = event {
                            match drop_event {
                                tauri::DragDropEvent::Drop { paths, position } => {
                                    println!("Files dropped: {:?} at {:?}", paths, position);
                                    // Emit event to all windows
                                    let _ = app_handle.emit(
                                        "file-drop",
                                        serde_json::json!({
                                            "paths": paths,
                                            "position": position
                                        }),
                                    );
                                }
                                _ => {}
                            }
                        }
                    });
                }
            }

            // Create system tray menu
            let show_hide = MenuItem::with_id(app, "show_hide", "Show/Hide", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_hide, &settings, &quit])?;

            // Create system tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show_hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        "settings" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                // Emit event to open settings
                                let _ = window.emit("open-settings", ());
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
