use base64::Engine; // Needed for .encode()
use image::ImageOutputFormat;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;
use windows::Win32::Graphics::Gdi::{
    CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits, GetObjectW, ReleaseDC,
    SelectObject, BITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HBITMAP,
};
use windows::Win32::Storage::FileSystem::FILE_ATTRIBUTE_NORMAL;
use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON};
use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, HICON};

// Ensure we clean up GDI objects
struct GdiObject<T: Copy>(T, fn(T));
impl<T: Copy> Drop for GdiObject<T> {
    fn drop(&mut self) {
        (self.1)(self.0);
    }
}

pub fn get_icon(app_handle: &tauri::AppHandle, path: String) -> Result<String, String> {
    // 1. Calculate Cache Key (Hash of path)
    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    let result = hasher.finalize();
    let hash = hex::encode(result);

    // 2. Setup Cache Directory
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let cache_dir = app_dir.join("cache").join("icons");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }

    let cache_file = cache_dir.join(format!("{}.png", hash));

    // 3. Check Cache
    if cache_file.exists() {
        // Read from cache
        match fs::read(&cache_file) {
            Ok(data) => {
                let base64_string = base64::engine::general_purpose::STANDARD.encode(&data);
                return Ok(format!("data:image/png;base64,{}", base64_string));
            }
            Err(e) => {
                println!("Failed to read cache: {}", e);
                // Fallthrough to regenerate
            }
        }
    }

    // 4. Extract Icon
    let png_data = extract_icon_png(&path)?;

    // 5. Save to Cache (ignore write errors to avoid blocking UI)
    let _ = fs::write(&cache_file, &png_data);

    // 6. Return Base64
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&png_data);
    Ok(format!("data:image/png;base64,{}", base64_string))
}

#[cfg(target_os = "windows")]
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
