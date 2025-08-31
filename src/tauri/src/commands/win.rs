use std::collections::HashMap;
use log::info;
use tauri::{command, LogicalPosition, Manager};

#[command]
pub fn win_close(app_handle: tauri::AppHandle) {
    #[cfg(not(target_os = "macos"))] {
        let window = app_handle.get_webview_window("main").unwrap();
        window.hide().unwrap();
    }
}

#[tauri::command]
pub fn win_minimize(window: tauri::Window) {
    window.minimize().unwrap();
}

#[tauri::command]
pub fn win_maximize(window: tauri::Window) {
    window.maximize().unwrap();
}

// #[command]
// pub fn win_relaunch() {
//     // 重新启动窗口
//     let app = tauri::AppHandle::current();
//     app.relaunch().unwrap();
//     app.exit(0);
// }

#[command]
pub fn win_always_top(window: tauri::Window, data: bool) {
    window.set_always_on_top(data).unwrap();
}


#[command]
pub fn win_get_window_info(window: tauri::Window) -> HashMap<String, i32> {
    // 获取 x, y, width, height
    let position = window.outer_position().unwrap();
    let size = window.outer_size().unwrap();
    let mut data = HashMap::new();
    data.insert(String::from("x"), position.x);
    data.insert(String::from("y"), position.y);
    data.insert(String::from("width"), size.width as i32);
    data.insert(String::from("height"), size.height as i32);
    return data;
}

#[command]
pub fn win_move(window: tauri::Window, x: i32, y: i32) {
    let scale = window.scale_factor().unwrap();
    // 将像素转换为逻辑位置
    let x = (x as f64 / scale) as i32;
    let y = (y as f64 / scale) as i32;
    window.set_position(LogicalPosition::new(x, y)).unwrap();
}

#[command]
pub fn win_open_dev_tools(app: tauri::AppHandle) {
    app.get_webview_window("main").unwrap().open_devtools();
}

#[command]
pub fn win_set_title(window: tauri::Window, data: String) {
    window.set_title(&data).unwrap();
}


#[command]
pub fn win_is_tiling() -> bool {
    #[cfg(target_os = "linux")]
    {
        const TILING_WMS: [&str; 6] = [
            "i3",
            "sway",
            "bspwm",
            "awesome",
            "herbstluftwm",
            "hyprland"
        ];
        use std::env;
        let wm = env::var("XDG_CURRENT_DESKTOP")
            .or_else(|_| env::var("DESKTOP_SESSION"))
            .or_else(|_| env::var("GDMSESSION"))
            .unwrap_or_default()
            .to_lowercase();
        return TILING_WMS.contains(&wm.as_str());
    }
    #[cfg(not(target_os = "linux"))]
    {
        return false;
    }
}
