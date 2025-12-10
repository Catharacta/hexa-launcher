// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// アプリケーションのエントリーポイント。
/// ライブラリクレートの `run` 関数を呼び出してアプリケーションを開始します。
fn main() {
    hexa_launcher_app_lib::run()
}
