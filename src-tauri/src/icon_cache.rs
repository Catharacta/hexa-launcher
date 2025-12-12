use base64::Engine; // Needed for .encode()
use image::ImageOutputFormat;
use sha2::{Digest, Sha256};
use std::fs;

use tauri::Manager;
use windows::Win32::Graphics::Gdi::{
    CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits, GetObjectW, ReleaseDC,
    SelectObject, BITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HBITMAP,
};
use windows::Win32::Storage::FileSystem::FILE_ATTRIBUTE_NORMAL;
use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON};
use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, HICON};

// GDIオブジェクトの確実なクリーンアップを保証するためのラッパー構造体
struct GdiObject<T: Copy>(T, fn(T));
impl<T: Copy> Drop for GdiObject<T> {
    fn drop(&mut self) {
        (self.1)(self.0);
    }
}

/// 指定されたパスのファイルのアイコンを取得し、Base64エンコードされたPNG画像として返します。
///
/// パフォーマンスを最適化するため、以下のキャッシュ戦略を採用しています：
/// 1. パスのSHA256ハッシュを計算し、キャッシュキーとします。
/// 2. ディスク上のキャッシュ（`AppData/cache/icons/`）を確認します。
/// 3. キャッシュが存在すれば、それを読み込んで返します。
/// 4. キャッシュがない場合、Windows APIを使用してアイコンを抽出・PNG変換し、ディスクに保存してから返します。
///
/// # 引数
/// * `app_handle` - TauriのAppHandle（キャッシュディレクトリパス取得用）
/// * `path` - アイコンを取得したいファイルのパス
pub fn get_icon(app_handle: &tauri::AppHandle, path: String) -> Result<String, String> {
    // 1. キャッシュキーの計算 (パスのハッシュ値)
    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    let result = hasher.finalize();
    let hash = hex::encode(result);

    // 2. キャッシュディレクトリのセットアップ
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let cache_dir = app_dir.join("cache").join("icons");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }

    let cache_file = cache_dir.join(format!("{}.png", hash));

    // 3. キャッシュの確認
    if cache_file.exists() {
        // キャッシュからの読み込み
        match fs::read(&cache_file) {
            Ok(data) => {
                let base64_string = base64::engine::general_purpose::STANDARD.encode(&data);
                return Ok(format!("data:image/png;base64,{}", base64_string));
            }
            Err(e) => {
                println!("Failed to read cache: {}", e);
                // 読み込み失敗時は再生成へフォールスルー
            }
        }
    }

    // 4. アイコンの抽出 (Windows API使用)
    let png_data = extract_icon_png(&path)?;

    // 5. キャッシュへの保存 (UIブロックを避けるため書き込みエラーは無視)
    let _ = fs::write(&cache_file, &png_data);

    // 6. Base64文字列として返却
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&png_data);
    Ok(format!("data:image/png;base64,{}", base64_string))
}

#[cfg(target_os = "windows")]
/// Windows APIを使用してファイルからアイコンを抽出し、PNGデータに変換します。
///
/// `SHGetFileInfoW` でアイコンハンドルを取得し、`icon_to_png` で画像データに変換します。
fn extract_icon_png(path: &str) -> Result<Vec<u8>, String> {
    unsafe {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;

        let wide_path: Vec<u16> = OsStr::new(path)
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

        let png_data = icon_to_png(hicon).map_err(|e| {
            let _ = DestroyIcon(hicon);
            e
        })?;

        let _ = DestroyIcon(hicon);
        Ok(png_data)
    }
}

#[cfg(not(target_os = "windows"))]
/// Windows以外のOSではアイコン抽出は未サポートです。
fn extract_icon_png(_path: &str) -> Result<Vec<u8>, String> {
    Err("Icon extraction is only supported on Windows".to_string())
}

#[cfg(target_os = "windows")]
unsafe fn icon_to_png(hicon: HICON) -> Result<Vec<u8>, String> {
    let mut icon_info = std::mem::zeroed();
    if GetIconInfo(hicon, &mut icon_info).is_err() {
        return Err("Failed to get icon info".to_string());
    }

    let hbitmap = icon_info.hbmColor;
    let _hbm_mask = icon_info.hbmMask;

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
    bi.bmiHeader.biHeight = -height;
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

    SelectObject(hdc_mem, old_obj);

    // Convert BGRA to RGBA
    for chunk in pixels.chunks_mut(4) {
        let b = chunk[0];
        let r = chunk[2];
        chunk[0] = r;
        chunk[2] = b;
    }

    let mut png_buffer = Vec::new();
    let img_buffer: image::ImageBuffer<image::Rgba<u8>, _> =
        image::ImageBuffer::from_raw(width as u32, height as u32, pixels)
            .ok_or("Failed to create image buffer")?;

    img_buffer
        .write_to(
            &mut std::io::Cursor::new(&mut png_buffer),
            ImageOutputFormat::Png,
        )
        .map_err(|e| e.to_string())?;

    Ok(png_buffer)
}

/// 指定されたリソースキー（キャッシュ用）、ファイルパス、インデックスを使用してアイコンを取得します。
/// キャッシュロジックは get_icon と同様です。
pub fn get_icon_by_resource(
    app_handle: &tauri::AppHandle,
    cache_key: &str,
    path: &str,
    index: i32,
) -> Result<String, String> {
    // 1. キャッシュキーのハッシュ化
    let mut hasher = Sha256::new();
    hasher.update(cache_key.as_bytes());
    let result = hasher.finalize();
    let hash = hex::encode(result);

    // 2. キャッシュディレクトリのセットアップ
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let cache_dir = app_dir.join("cache").join("icons");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }

    let cache_file = cache_dir.join(format!("{}.png", hash));

    // 3. キャッシュの確認
    if cache_file.exists() {
        match fs::read(&cache_file) {
            Ok(data) => {
                let base64_string = base64::engine::general_purpose::STANDARD.encode(&data);
                return Ok(format!("data:image/png;base64,{}", base64_string));
            }
            Err(e) => {
                println!("Failed to read cache: {}", e);
            }
        }
    }

    // 4. アイコンの抽出 (Resource Index指定)
    let png_data = extract_icon_from_resource(path, index)?;

    // 5. キャッシュへの保存
    let _ = fs::write(&cache_file, &png_data);

    // 6. Base64文字列として返却
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&png_data);
    Ok(format!("data:image/png;base64,{}", base64_string))
}

#[cfg(target_os = "windows")]
/// 指定されたリソースパスとインデックスからアイコンを抽出します。
/// PrivateExtractIconsWを使用しています。
pub fn extract_icon_from_resource(path: &str, index: i32) -> Result<Vec<u8>, String> {
    unsafe {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, PrivateExtractIconsW};

        // Create a fixed-size buffer for MAX_PATH (260)
        let mut path_buf = [0u16; 260]; // MAX_PATH
        let wide_path: Vec<u16> = OsStr::new(path)
            .encode_wide()
            .take(259) // Ensure null terminator fits
            .collect();

        // Copy to buffer
        for (i, &c) in wide_path.iter().enumerate() {
            path_buf[i] = c;
        }
        path_buf[wide_path.len()] = 0; // Null terminator

        let mut hicon_out = [HICON(std::ptr::null_mut())];
        let mut id_out = [0u32];

        // 256x256のアイコン取得を試みる
        // Expects &[u16; 260] for filename according to previous error.

        let extracted_count = PrivateExtractIconsW(
            &path_buf,
            index,
            256,
            256,
            Some(&mut hicon_out),
            Some(id_out.as_mut_ptr()),
            1,
        );

        if extracted_count == 0 || hicon_out[0].is_invalid() {
            return Err(format!(
                "Failed to extract icon from {} at index {}",
                path, index
            ));
        }

        let hicon = hicon_out[0];

        // Convert to PNG
        let png_data = icon_to_png(hicon).map_err(|e| {
            let _ = DestroyIcon(hicon);
            e
        })?;

        let _ = DestroyIcon(hicon);
        Ok(png_data)
    }
}

#[cfg(not(target_os = "windows"))]
pub fn extract_icon_from_resource(_path: &str, _index: i32) -> Result<Vec<u8>, String> {
    Err("Icon extraction is only supported on Windows".to_string())
}
