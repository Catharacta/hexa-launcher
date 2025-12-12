use serde::Serialize;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use windows::core::{Interface, PCWSTR};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoUninitialize, IPersistFile, CLSCTX_INPROC_SERVER,
    COINIT_APARTMENTTHREADED, STGM,
};
use windows::Win32::UI::Shell::{IShellLinkW, ShellLink};

#[derive(Serialize)]
pub struct ShortcutInfo {
    /// ショートカットのターゲットパス（実行ファイルなど）
    pub target: String,
    /// 起動引数
    pub arguments: String,
    /// 作業ディレクトリ
    pub working_dir: String,
    /// アイコンパス（リソースファイル）
    pub icon_path: String,
    /// アイコンインデックス
    pub icon_index: i32,
}

/// Windowsのショートカット(.lnk)ファイルの情報を解決・取得します。
///
/// COMインターフェース(`IShellLinkW`)を使用して、リンク先、引数、作業ディレクトリを取得します。
///
/// # 引数
/// * `path` - .lnkファイルのパス
pub fn resolve_lnk(path: &str) -> Result<ShortcutInfo, String> {
    unsafe {
        // Initialize COM library
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        let result = (|| -> Result<ShortcutInfo, String> {
            let shell_link: IShellLinkW = CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)
                .map_err(|e| format!("Failed to create ShellLink instance: {}", e))?;

            let persist_file: IPersistFile = shell_link
                .cast()
                .map_err(|e| format!("Failed to cast to IPersistFile: {}", e))?;

            let wide_path: Vec<u16> = OsStr::new(path)
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();

            // Use STGM(0) if STGM is a struct, or default.
            // In windows 0.58, STGM is likely a struct around u32.
            // 0 is STGM_READ (implied).
            persist_file
                .Load(PCWSTR(wide_path.as_ptr()), STGM(0))
                .map_err(|e| format!("Failed to load link file: {}", e))?;

            // Get Target Path
            let mut target_buffer = [0u16; 520];
            // GetPath expects *mut WIN32_FIND_DATAW, and u32 flags.
            let _ = shell_link.GetPath(&mut target_buffer, std::ptr::null_mut(), 0);
            let target = String::from_utf16_lossy(&target_buffer)
                .trim_matches(char::from(0))
                .to_string();

            // Get Arguments
            let mut args_buffer = [0u16; 1024];
            let _ = shell_link.GetArguments(&mut args_buffer);
            let arguments = String::from_utf16_lossy(&args_buffer)
                .trim_matches(char::from(0))
                .to_string();

            // Get Working Directory
            let mut cwd_buffer = [0u16; 520];
            let _ = shell_link.GetWorkingDirectory(&mut cwd_buffer);
            let working_dir = String::from_utf16_lossy(&cwd_buffer)
                .trim_matches(char::from(0))
                .to_string();

            // Get Icon Location
            let mut icon_path_buffer = [0u16; 520];
            let mut icon_index: i32 = 0;
            let _ = shell_link.GetIconLocation(&mut icon_path_buffer, &mut icon_index);
            let icon_path = String::from_utf16_lossy(&icon_path_buffer)
                .trim_matches(char::from(0))
                .to_string();

            Ok(ShortcutInfo {
                target,
                arguments,
                working_dir,
                icon_path,
                icon_index,
            })
        })();

        CoUninitialize();

        result
    }
}
