use std::fs;
use std::str::FromStr;
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos; // Needed for multi-monitor logic

mod backup_manager;
mod icon_cache;
mod mouse_edge;
mod security;
mod shortcut_utils;
mod startup;
mod system_stats;
mod uwp_utils;
mod window_behavior;

#[tauri::command]
fn save_settings(app_handle: tauri::AppHandle, settings: String) -> Result<(), String> {
    // Attempt backup before saving new settings
    // Log error but don't fail the save if backup fails
    if let Err(e) = backup_manager::create_backup(&app_handle) {
        println!("Backup failed: {}", e);
    }

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
fn resolve_shortcut(path: String) -> Result<shortcut_utils::ShortcutInfo, String> {
    shortcut_utils::resolve_lnk(&path)
}

#[tauri::command]
fn get_uwp_apps() -> Result<Vec<uwp_utils::UwpApp>, String> {
    uwp_utils::get_installed_uwp_apps()
}

#[tauri::command]
fn launch_uwp_app(aumid: String) -> Result<(), String> {
    uwp_utils::launch_uwp(&aumid)
}

#[tauri::command]
fn get_file_icon(app_handle: tauri::AppHandle, path: String) -> Result<String, String> {
    // Use the new icon cache module
    icon_cache::get_icon(&app_handle, path)
}

#[tauri::command]
fn start_mouse_edge_monitor(app_handle: tauri::AppHandle) -> Result<(), String> {
    let monitor = app_handle.state::<mouse_edge::MouseEdgeMonitor>();
    monitor.start(app_handle.clone());
    Ok(())
}

#[tauri::command]
fn stop_mouse_edge_monitor(app_handle: tauri::AppHandle) -> Result<(), String> {
    let monitor = app_handle.state::<mouse_edge::MouseEdgeMonitor>();
    monitor.stop();
    Ok(())
}

#[tauri::command]
fn start_system_monitor(app_handle: tauri::AppHandle) -> Result<(), String> {
    let monitor = app_handle.state::<system_stats::SystemMonitor>();
    monitor.start(app_handle.clone());
    Ok(())
}

#[tauri::command]
fn stop_system_monitor(app_handle: tauri::AppHandle) -> Result<(), String> {
    let monitor = app_handle.state::<system_stats::SystemMonitor>();
    monitor.stop();
    Ok(())
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
            get_uwp_apps,
            launch_uwp_app,
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
            security::check_requires_admin,
            start_mouse_edge_monitor,
            stop_mouse_edge_monitor,
            start_system_monitor,
            stop_system_monitor,
        ])
        .setup(|app| {
            // Initialize mouse edge monitor
            app.manage(mouse_edge::MouseEdgeMonitor::new());
             // Initialize system monitor
            app.manage(system_stats::SystemMonitor::new());

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
                                            // Multi-monitor logic: Move to cursor monitor
                                            #[cfg(target_os = "windows")]
                                            unsafe {
                                                let mut point = std::mem::zeroed();
                                                if GetCursorPos(&mut point).is_ok() {
                                                    let mouse_x = point.x;
                                                    let mouse_y = point.y;
                                                    if let Ok(monitors) = app.available_monitors() {
                                                        for monitor in monitors {
                                                            let m_pos = monitor.position();
                                                            let m_size = monitor.size();
                                                            let x_in_monitor = mouse_x >= m_pos.x
                                                                && mouse_x
                                                                    < m_pos.x + m_size.width as i32;
                                                            let y_in_monitor = mouse_y >= m_pos.y
                                                                && mouse_y
                                                                    < m_pos.y
                                                                        + m_size.height as i32;

                                                            if x_in_monitor && y_in_monitor {
                                                                println!("Shortcut trigger on monitor at {:?}", m_pos);
                                                                let _ = window.unmaximize();
                                                                let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 800, height: 600 }));
                                                                let _ = window.set_position(
                                                                    tauri::Position::Physical(
                                                                        m_pos.clone(),
                                                                    ),
                                                                );
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            let _ = window.show();
                                            let _ = window.maximize();
                                            let _ = window.unminimize();
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
                                    // Multi-monitor logic: Move to cursor monitor
                                    #[cfg(target_os = "windows")]
                                    unsafe {
                                        let mut point = std::mem::zeroed();
                                        if GetCursorPos(&mut point).is_ok() {
                                            let mouse_x = point.x;
                                            let mouse_y = point.y;
                                            if let Ok(monitors) = app.available_monitors() {
                                                for monitor in monitors {
                                                    let m_pos = monitor.position();
                                                    let m_size = monitor.size();
                                                    let x_in_monitor = mouse_x >= m_pos.x
                                                        && mouse_x < m_pos.x + m_size.width as i32;
                                                    let y_in_monitor = mouse_y >= m_pos.y
                                                        && mouse_y < m_pos.y + m_size.height as i32;

                                                    // Debug logs
                                                    println!("Tray trigger on monitor at {:?}", m_pos);
                                                    if x_in_monitor && y_in_monitor {
                                                        let _ = window.unmaximize();
                                                        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: 800, height: 600 }));
                                                        let _ = window.set_position(
                                                            tauri::Position::Physical(
                                                                m_pos.clone(),
                                                            ),
                                                        );
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    let _ = window.show();
                                    let _ = window.maximize();
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
