mod commands;

use std::collections::HashMap;

use commands::utils::http_proxy::ProxyServer;
use log::{info, error};
use log4rs::{append::console::ConsoleAppender, config::{Appender, Logger, Root}, Config};
use once_cell::sync::OnceCell;
use tauri::{ async_runtime::handle, menu::{Menu, MenuEvent, MenuItem}, tray::{TrayIcon, TrayIconBuilder, TrayIconEvent}, AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder };
use tauri_plugin_store::StoreBuilder;
use user_notify::{get_notification_manager, NotificationCategory, NotificationCategoryAction};

pub static PROXY_PORT: OnceCell<u16> = OnceCell::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// Tauri 应用程序入口
pub fn run() {
    let rt = tokio::runtime::Runtime::new().unwrap();

    // 初始化本地代理服务器 ============
    let proxy = rt.block_on(async {
        let proxy = ProxyServer::new().await;
        proxy
    });
    PROXY_PORT.set(proxy.port).unwrap();

    // 初始化 Tauri 应用程序 ============
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let store =
                StoreBuilder::new(app, ".settings.dat").build().map_err(|e| e.to_string())?;
            let log_level = store.get("log_level").unwrap_or_default();
            let final_log_level = match log_level.as_str() {
                Some("err") => log::LevelFilter::Error,
                Some("debug") => log::LevelFilter::Debug,
                Some("info") => log::LevelFilter::Info,
                Some("all") => log::LevelFilter::Debug,
                _ => log::LevelFilter::Info,
            };
            // 初始化 log4rs
            let stdout = ConsoleAppender::builder()
                .encoder(Box::new(commands::utils::colored_encoder::ColoredPrefixEncoder))
                .build();
            let config = Config::builder()
                .appender(Appender::builder().build("stdout", Box::new(stdout)))
                .logger(Logger::builder().build("tao", log::LevelFilter::Info))
                .logger(Logger::builder().build("tungstenite", log::LevelFilter::Info))
                .logger(Logger::builder().build("tokio_tungstenite", log::LevelFilter::Info))
                .logger(Logger::builder().build("hyper", log::LevelFilter::Info))
                .logger(Logger::builder().build("hyper_util", log::LevelFilter::Info))
                .logger(Logger::builder().build("reqwest", log::LevelFilter::Info))
                .logger(Logger::builder().build("warp", log::LevelFilter::Info))
                .build(Root::builder().appender("stdout").build(final_log_level))
                .unwrap();

            log4rs::init_config(config).unwrap();

            println!("");
            println!(" _____ _____ _____ _____ __ __ ");
            println!("|   __|_   _|  _  |  _  |  |  |");
            println!("|__   | | | |     |   __|-   -|");
            println!("|_____| |_| |__|__|__|  |__|__| CopyRight © Stapx Steve");
            println!("=======================================================");
            println!("日志等级:{}", log_level);

            if PROXY_PORT.get().is_some() {
                info!("代理服务器已启动，端口：{}", PROXY_PORT.get().unwrap());
            }

            // 初始化全局通知管理器 ============
            let app_id = app.config().identifier.clone();
            let manager =
                get_notification_manager(app_id, Some("stapxs-qq-lite".to_owned()));
            let categories = vec![NotificationCategory {
                identifier: "cn.stapxs.qqweb.reply".to_string(),
                actions: vec![NotificationCategoryAction::TextInputAction {
                    identifier: "cn.stapxs.qqweb.reply.action".to_string(),
                    title: "回复".to_string(),
                    input_button_title: "发送".to_string(),
                    input_placeholder: "输入以快速回复".to_string(),
                }],
            }];
            let rt = handle();

            let app_handle = app.handle().clone();
            manager.register(
                    Box::new(move |response| {
                        let app_handle_clone = app_handle.clone();
                        rt.spawn(async move {
                            info!("response {:?}", response);
                            let action = response.action;
                            let user_info = response.user_info.get("NotificationPayload")
                                .and_then(|v| Some(v.as_str()))
                                .unwrap_or("");
                            let user_text = response.user_text.unwrap_or_default();
                            let parts: Vec<&str> = user_info.split('/').collect();
                            match action {
                                user_notify::NotificationResponseAction::Default => {
                                    if parts.len() >= 2 {
                                        let user_id = parts[0];
                                        let message_id = parts[1];
                                        // 提交前端
                                        let mut payload = HashMap::new();
                                        payload.insert("userId", user_id.to_string());
                                        payload.insert("msgId", message_id.to_string());
                                        app_handle_clone.emit("app:jumpChat", payload).unwrap();
                                    }
                                }
                                user_notify::NotificationResponseAction::Dismiss => {
                                    // do nothing
                                }
                                user_notify::NotificationResponseAction::Other(action_id) => {
                                    // action_id 前面可能会有个斜杠，去除
                                    let action_id = action_id.trim_start_matches('/');
                                    if parts.len() >= 3 && !user_text.is_empty()
                                            && action_id == "cn.stapxs.qqweb.reply.action" {
                                        let user_id = parts[0];
                                        let message_id = parts[1];
                                        let chat_type = parts[2];
                                        // 提交前端
                                        let mut payload = HashMap::new();
                                        payload.insert("id", user_id.to_string());
                                        payload.insert("msg", message_id.to_string());
                                        payload.insert("type", chat_type.to_string());
                                        payload.insert("content", user_text);
                                        app_handle_clone.emit("bot:quickReply", payload).unwrap();
                                    }
                                }
                            }
                        });
                    }),
                    categories,
                )
                .unwrap();
            #[cfg(not(any(target_os = "macos", target_os = "windows")))]
            {
                // remove all notifications that are still there from previous sessions,
                // as they probably don't work anymore and are just stuck
                //
                // https://github.com/deltachat/deltachat-desktop/issues/2438#issuecomment-1090735045
                if let Err(err) = manager.remove_all_delivered_notifications() {
                    log::error!("remove_all_delivered_notifications: {err:?}");
                }
            }
            app.manage(manager);

            info!("初始化通知管理器完成");

            // 创建主窗体 ============
            info!("欢迎使用 Stapxs QQ Lite, 当前版本: {}", env!("CARGO_PKG_VERSION"));
            info!("启动平台架构：{}", std::env::consts::OS);
            info!("正在创建窗体 ……");
            let window = create_window(app)?;
            info!("窗体创建成功");

            // 其他窗口事件
            let window_clone_event = window.clone();
            window.on_window_event(move |event| {
                match event {
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        #[cfg(not(target_os = "macos"))] {
                            window_clone_event.hide().unwrap();
                        }
                        #[cfg(target_os = "macos")] {
                            tauri::AppHandle::hide(window_clone_event.app_handle()).unwrap();
                        }
                        api.prevent_close();
                    }
                    tauri::WindowEvent::Resized { .. } => {
						let _ = window_clone_event.emit(
							"win:maximizedChanged",
							window_clone_event.is_maximized().unwrap_or(false)
						);
                    }
                    _ => {}
                }
            });

            // 创建托盘
            #[cfg(not(target_os = "macos"))]
            build_tray(app.handle().clone());

            Ok(())
        })
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            info!("已有实例正在运行 ……");
            let window = app.get_webview_window("main").unwrap();
            window.unminimize().unwrap();
            window.set_focus().unwrap();
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::sys::sys_front_loaded,
            commands::sys::sys_get_platform,
            commands::sys::sys_get_release,
            commands::sys::sys_create_menu,
            commands::sys::sys_update_menu,
            commands::sys::sys_run_proxy,
            commands::sys::sys_send_notice,
            commands::sys::sys_close_notice,
            commands::sys::sys_close_all_notice,
            commands::sys::sys_clear_notice,
            commands::sys::sys_open_in_browser,
            commands::sys::sys_run_command,
            commands::sys::sys_get_win_color,
            commands::sys::sys_get_final_redirect_url,
            commands::sys::sys_get_html,
            commands::sys::sys_get_api,
            commands::sys::sys_download,
            commands::sys::sys_flush_on_message,
            commands::sys::sys_flush_friend_search,
            commands::onebot::onebot_connect,
            commands::onebot::onebot_send,
            commands::onebot::onebot_close,
            commands::win::win_close,
            commands::win::win_minimize,
            commands::win::win_maximize,
            commands::win::win_unmaximize,
            commands::win::win_always_top,
            commands::win::win_get_window_info,
            commands::win::win_move,
            commands::win::win_open_dev_tools,
            commands::win::win_set_title,
            commands::win::win_is_tiling,
            commands::win::win_is_maximized,
            commands::opt::opt_get_system_info,
            commands::opt::opt_store,
            commands::opt::opt_save_all,
            commands::opt::opt_get_all,
            commands::opt::opt_get,
            commands::opt::opt_clear_all,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// 创建主窗体配置
fn create_window(app: &mut tauri::App) -> tauri::Result<tauri::WebviewWindow> {
    let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("/".into()))
        .title("Stapxs QQ Lite")
        .inner_size(850.0, 530.0)
        .transparent(true);
    #[cfg(target_os = "macos")]
    let win_builder = win_builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        .background_color(tauri::window::Color(0, 0, 0, 1))
        .accept_first_mouse(true)
        .effects(tauri::window::EffectsBuilder::new()
            .effects(vec![tauri::window::Effect::Sidebar])
            .build());
    #[cfg(target_os = "linux")]
    let win_builder = win_builder
        .decorations(false)
        .disable_drag_drop_handler();
    let window = win_builder.build()?;
    #[cfg(target_os = "windows")] {
        let _ = window.set_decorations(false);
        window_vibrancy::apply_acrylic(&window, Some((18, 18, 18, 125)))
            .expect("Unsupported platform! 'apply_blur' is only supported on Windows");
    }
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
    }
    Ok(window)
}

#[cfg(not(target_os = "macos"))]
fn build_tray(app: AppHandle) -> TrayIcon {
    let show = MenuItem::with_id(
        &app, "show", "显示", true, None::<&str>).unwrap();
    let quit = MenuItem::with_id(
        &app, "quit", "退出", true, None::<&str>).unwrap();

    let menu = Menu::with_items(
        &app, &[&show, &quit]).unwrap();

    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .build(&app)
        .unwrap();

    tray.on_tray_icon_event(move |_, event| {
        if let TrayIconEvent::DoubleClick { .. } = event {
            show_hidden_app(app.clone());
        }
    });

    tray.on_menu_event(|app, event| {
        let MenuEvent { id, .. } = event;
        match id.0.as_str() {
            "show" => {
                show_hidden_app(app.clone());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        }
    });

    tray
}

fn show_hidden_app(app: AppHandle) {
    let window = app.get_webview_window("main").unwrap();
    #[cfg(not(target_os = "macos"))]
    window.show().unwrap();
    #[cfg(target_os = "macos")]
    tauri::AppHandle::show(&app).unwrap();
    window.set_focus().unwrap();
}
